"use strict";

let pollerName = "ActivityPoller";

/*
  START: Dependencies.
*/
const configs = require("../../scripts/configs.json");
configs.AwsSdk = require("aws-sdk");

/*
  Freeze configs so down stream types don't mess with it and hurt others
*/
Object.freeze(configs);

const conns = require("../../lib/conns").init(configs);
const act = require("../../lib/utils/act").init(configs);
/*
  END: Dependencies
*/

module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  let polling = 0;
  let logs = {};
  let pollerName = `ActivityPoller:${context.awsRequestId}`;
  let memoryThreshold = context.memoryLimitInMB - (context.memoryLimitInMB * 0.1);
    
  function proceedCheck() {
    if(context.getRemainingTimeInMillis() <= 70000) {
      /*
        Less than 70 seconds left in lambda runtime.
        With an additional 5 seconds buffer for sanity.
        Don't poll again due to the long poll bug.
          - @TODO: link to markdown writup
          - Risk is dropped orphan activity.taskToken
      */
      return false;
    }

    if(process.memoryUsage().rss / 1048576 >= memoryThreshold) {
      /*
        Getting close to running out of lambda runtime memory.
        With an additional 10% memory buffer.
        Don't poll again due to the long poll bug
          - @TODO: link to markdown writup
          - Risk is dropped orphan activity.taskToken
      */
      return false;
    }
    return true;
  }

  function doPoll(arn, proceedCheck) {
    if(proceedCheck()) {
      polling++;
      logs[arn].polls++;

      conns.getActivityTask({
        arn: arn,
        workerName: pollerName
      }).then((activity) => {
        if(!activity.taskToken) {
          /*
            getActivityTask responds with an empty taskToken
            if it was just the expiration of the long poll
            without a new activity instance being scheduled.
            In which case we can just resolve onwards, 
            which will trigger another doPoll.
          */
          return Promise.resolve();
        }

        logs[arn].recieved++;

        try {
          activity.input = JSON.parse(activity.input);
        } catch(e) {
          /*
            Bad input. The error below is descriptive of why we are rejecting;
          */
          return conns.sendTaskFailure({
            taskToken: activity.taskToken,
            cause: "ActivityPoller expects the input to be an object or an array. Something JSON.parse()-able",
            error: "INVALID-INPUT",
          });
        }

        /*
          Preliminary checks pass, send it down to handle the activity
        */
        logs[arn].handled++;
        return act.handleActivity(arn, activity);

      }).then(() => {
        polling--;
        process.nextTick(() => {
          doPoll(arn, proceedCheck);
        });
      })
    } else {
      console.log("proceedCheck:false", arn)
      if(polling <= 0) {
        /*
          Done.  Message below is descriptive.  
          console.log out a logs dump, and callback to end lambda early if possible
        */
        console.log(logs);
        callback(null, {
          message: "All activity pollers elected to stop proceeding due to time/memory thresholds",
          logs: logs,
        });

      }
    }
    return;
  }
  
  /*
    Begin a polling loop for each individual activityArn.
    Since they all share a proceedCheck, the ordering doesn't matter.
  */
  configs.activitiesArns.forEach((activityArn) => {
    logs[activityArn] = {
      polls: 0,
      recieved: 0,
      handled: 0
    };
    doPoll(activityArn, proceedCheck);
  });
}


// END