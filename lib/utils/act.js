"use strict";

const DOT = require("./dot");
const UID = require("./uid");
const TYP = require("./typ");

const createPayload = {
  QueryableActivity: function(input, instructions) {
    return {
      input: DOT.get(input, instructions.InputPath, null),
      queryable: DOT.get(input, instructions.Queryable, null),
    }
  },

  Lambda: function(input, instructions) {
    return {
      input: DOT.get(input, instructions.InputPath, null)
    }
  },

  SubStep: function(input, instructions) {
    return {
      initial: DOT.get(input, instructions.InputPath, null),
      meta: {
        /*
          v1 Sortables are a rearranging of UUID.v1's so that
          they are lexigraphically sortable by time... since its
          silly that the "time based" uuid format isn't time sorteable
        */
        name: UID.v1Sortable(),
        arn: instructions.Resource,
        parent: {
          /*
            We set the parent information for the "new" SubStep
            to be whatever the current information of the context
            of the calling activity was.  Thus in logs we retain a linkage.
            That data is NOT meant for any operational/logical purpose.

            Which is why we explicitely do NOT bring in the taskToken if it
            exists... because that would leak information scope to the child
            Sub Step which could close out its parent etc.
          */
          name: DOT.get(input, "$.meta.name", null),
          arn: DOT.get(input, "$.meta.arn", null),

          stage: DOT.get(input, "$.meta.stage", null),
          alias: DOT.get(input, "$.meta.alias", null),
          version: DOT.get(input, "$.meta.version", null),
          region: DOT.get(input, "$.meta.region", null),
        }
      }
    }
  },
}

module.exports = {
  init: (configs) => {
    let conns = require("../conns").init(configs);
    let data = require("../data").init(configs);

    const handlers = {
      QueryableActivity: (arn, activity, instructions, payload) => {
        /*
          Our instructions payload for QueryableActivities looks like the following
          
          {
            "Resource": "arn:aws:states:::activity:activity-name",
            "InputPath": json path to an object/array or primitive,
            "Queryable": json path to an object,
            "Type": "QueryableActivity"
          }

          We will then pluck the inputPath out of the full activity input
          and send that as if you had actually set InputPath on the Activity Pass
        */
        let activityParts = arn.split(":");
        
        payload = payload || createPayload.QueryableActivity(activity.input, instructions);

        return data.putActivity({
          taskToken: activity.taskToken,
          payload: payload,
          type: "QueryableActivity",
          activity: activityParts[activityParts.length - 1],
          status: "WAITING",
          instructions: instructions,
          internalToken: payload.internalToken
        });
      },
      Lambda: (arn, activity, instructions, payload) => {
        /*
          These are a sub Handler for when ParallelEach are utilized.
          Our instructions payload for Lambda looks like the following
          
          {
            "Resource": "arn:aws:states:::activity:activity-name",
            "InputPath": json path to an object/array or primitive,
            "Type": "Lambda"
          }

          We will then pluck the inputPath out of the full activity input
          and send that as if you had actually set InputPath on the Activity Pass

          These lambdas will essentially call Closer at the end of their run.
        */
        let activityParts = arn.split(":");

        payload = payload || createPayload.Lambda(activity.input, instructions);

        return data.putActivity({
          taskToken: activity.taskToken,
          payload: payload,
          type: "Lambda",
          activity: activityParts[activityParts.length - 1],
          status: "RUNNING",
          instructions: instructions,
          internalToken: payload.internalToken
        }).then((token) => {
          payload.meta.taskToken = token;
          return conns.lambdaStarter(payload);
        });
      },
      SubStep: (arn, activity, instructions, payload) => {
        /*
          Our instructions payload for SubSteps looks like the following
          
          {
            "Resource": "::states::stateMachine:Do-Text-Request",
            "InputPath": json path to an object/array or primitive,
            "Type": "SubStep"
          }

          We will then pluck the inputPath out of the full activity input
          and send that as if you had actually set InputPath on the Activity Pass
        */
        let activityParts = arn.split(":");

        payload = payload || createPayload.SubStep(activity.input, instructions);

        /*
          We put the information to our internal activity tracker
          For things like heartbeat, timeout, and visibility into
          the fact that we did actually handler this activity as expected.
          This method is a promise that returns an internalToken
          for those cases where it is not a one to one with taskToken
        */
        return data.putActivity({
          taskToken: activity.taskToken,
          payload: payload,
          type: "SubStep",
          activity: activityParts[activityParts.length - 1],
          status: "RUNNING",
          instructions: instructions,
          internalToken: payload.internalToken
        }).then((token) => {
          /*
            We always start our Step Functions via StepStarter.
            Benefits are standardized contract of inputs,
            ability to leverage StepStarters versioning and aliasing map
            of step functions, and injection of information so that
            the running step function has insight into who it is.

            The SubStep will end with StepCloser which will use the $.meta.internalTaskToken
            to invoke our internal SendTaskSuccess|Failure, which will
            in turn invoke the actual stepFunction.sendTaskSuccess|Failure.
            The abstraction is useful for ParallelEach, even when not required in 
            this single instance.
          */
          payload.meta.taskToken = token;
          return conns.stepStarter(payload)
        })
      },
      ParallelEach: (arn, activity, instructions) => {
        // validate the each, follow it through,
        // then chain through to the individual branch handling

        /*
          {
            "Resource": "::states::stateMachine:Do-Text-Request",
            "InputPath": json path to an object/array or primitive,
            "Each": json path to an object/array or primitive starting from InputPath,
            "Type": "ParallelEach"
            "BranchType": "QueryableActivity | Lambda | SubStep"
          }
        */
        let activityParts = arn.split(":");
        let input = DOT.get(activity.input, instructions.InputPath, null); 
        let branches = Array.from(DOT.get(input, instructions.Each, null));
        let branchHandler = handlers[instructions.BranchType];
        if(!branchHandler) {
          /*
            Bad input. The error below is descriptive of why we are rejecting;
          */
          return conns.sendTaskFailure({
            taskToken: activity.taskToken,
            cause: "ActivityPoller ParallelEach branchHandlers must be QueryableActivities, Lambda, or SubStep",
            error: "INVALID-INSTRUCTIONS",
          });
        }

        if(branches.length == 0) {
          /*
            No Branches to loop over. We consider this to be "successfully" handled.
            Arguments could be made for being more strict if for example it was undefined,
            but I'm a bit more permissive usually by design.
          */
          return conns.sendTaskSuccess({
            taskToken: activity.taskToken,
            output: [],
          });
        }

        /*
          It helps to have the set of "sibling" internalTokens
          for things like the Promise.all behaviour.
          Making it so that you aren't always looking up "others for the same taskToken",
          but can do a more explicit: "oh I updated you, who're you'r siblings, cool".
        */
        return data.getInternalTokens(branches.length).then((tokens) => {
          let branchInstructions = Object.assign({}, instructions, {
            InputPath: "$",
            InternalTokens: tokens,
          });
          
          return Promise.all(branches.map((branch, index) => {
            
            let payload = createPayload[instructions.BranchType](branch, branchInstructions);
            payload.internalToken = tokens[index];
            return branchHandler(arn, activity, branchInstructions, payload);
          
          }));
        });
      }
    }

    function handleActivity(arn, activity) {
      const instructions = DOT.get(activity.input, "$.meta.instructions");
      if(!TYP.isObject(instructions)) {
        /*
          Bad input. The error below is descriptive of why we are rejecting;
        */
        return conns.sendTaskFailure({
          taskToken: activity.taskToken,
          cause: "ActivityPoller expects instructions on $.meta.instructions.",
          error: "INVALID-INSTRUCTIONS",
        });
      }

      if(!instructions.Resource) {
        return conns.sendTaskFailure({
          taskToken: activity.taskToken,
          cause: "ActivityPoller requires $.meta.instructions to have a Resource which is an arn",
          error: "INVALID-INSTRUCTIONS",
        });
      }

      let handler = handlers[instructions.Type];
      if(!handler) {
        /*
          Bad input. The error below is descriptive of why we are rejecting;
        */
        return conns.sendTaskFailure({
          taskToken: activity.taskToken,
          cause: "ActivityPoller can only process QueryableActivities, Lambda, SubStep, or ParallelEach",
          error: "INVALID-INSTRUCTIONS",
        });
      }

      /*
        Call through to the individual handler for this type of "Activity"
        the handler function will return a promise.
      */
      return handler(arn, activity, instructions).catch((err) => {
        /*
          Uncaught Error.  Should be rare as we should eagerly catch for better messaging
        */
        return conns.sendTaskFailure({
          taskToken: activity.taskToken,
          cause: err.message,
          error: err.name,
        });
      });
    }

    return Object.freeze({
      handleActivity: handleActivity,
    })
  }
}

// END