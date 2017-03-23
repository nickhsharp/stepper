"use strict";

let utils = require("../utils");

module.exports = {
  init: (configs) => {
    let conns = require("../conns").init(configs);
    let data = require("../data").init(configs);

    const handlers = {
      QueryableActivity: (activity, instructions) => {
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

        let payload = {
          input: utils.jsp.get(activity.input, instructions.InputPath, null),
          queryable: utils.jsp.get(activity.input, instructions.Queryable, null),
        };

        return data.putActivity({
          taskToken: activity.taskToken,
          payload: payload,
          type: "QueryableActivity",
        });
      },
      Lambda: (activity, instructions) => {
        let payload = {
          input: utils.jsp.get(activity.input, instructions.InputPath, null),
          meta: {}
        };

        return data.putActivity({
          taskToken: activity.taskToken,
          payload: payload,
          type: "Lambda",
        }).then((token) => {
          payload.meta.taskToken = token;
          return conns.lambdaStarter(payload);
        })
      },
      SubStep: (activity, instructions) => {
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

        let payload = {
          initial: utils.jsp.get(activity.input, instructions.InputPath, null),
          meta: {
            /*
              v1 Sortables are a rearranging of UUID.v1's so that
              they are lexigraphically sortable by time... since its
              silly that the "time based" uuid format isn't time sorteable
            */
            name: utils.UID.v1Sortable(),
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
              name: utils.jsp.get(activity.input, "$.meta.name", null),
              arn: utils.jsp.get(activity.input, "$.meta.arn", null),

              stage: utils.jsp.get(activity.input, "$.meta.stage", null),
              alias: utils.jsp.get(activity.input, "$.meta.alias", null),
              version: utils.jsp.get(activity.input, "$.meta.version", null),
              region: utils.jsp.get(activity.input, "$.meta.region", null),
            }
          }
        }
        
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
      ParallelEach: (activity, instructions) => {
        // validate the each, follow it through,
        // then chain through to the individual branch handling
      }
    }

    function handleActivity(arn, activity) {
      const instructions = utils.JSP.get(activity.input, "$.meta.instructions");
      if(!utils.TYP.isObject(instructions)) {
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
      return handler(activity, instructions, conns, data).catch((err) => {
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