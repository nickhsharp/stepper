"use strict";

/*
  START: Dependencies.
*/
const logger = require("utils/lib/log");
const configs = require("../../scripts/configs.json");
configs.AwsSdk = require("aws-sdk");

/*
  Freeze configs so down stream types don't mess with it and hurt others
*/
Object.freeze(configs);

const conns = require("../../lib/conns").init(configs);
const poller = require("../../lib/poller").init(configs, conns);
/*
  END: Dependencies
*/

module.exports.handler = (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  
  /*
    Define the proceedCheck argument in the context and callback scope
    and it will be injecteded into the doPoll.
  */
  let proceedCheck = poller.createProceedCheck(context.memoryLimitInMB, 
    context.getRemainingTimeInMillis, 
    `NoOpActivityPoller:${context.awsRequestId}`); 
  
  /*
    Define the individual activity instance handler and inject it
  */
  function handler(arn, activity) {
    try {
      activity.input = JSON.parse(activity.input);
    } catch(e) {
      let original = activity.input;
      activity.input = {
        original: original
      }
    }

    return conns.sendTaskSuccess({
      taskToken: activity.taskToken,
      output: activity.input
    });
  }

  /*
    Begin a polling loop for each individual activityArn.
    Since they all share a proceedCheck, the ordering doesn't matter.
    Do poll does not need the context or callback scope, those are handed in.
  */
  Promise.all(configs.activitiesArns.map((activityArn) => {
    return poller.doPoll(activityArn, proceedCheck, handler)
  })).then((ret) => {
    logger.log("RET", ret);
  }).catch((err) => {
    logger.log("Logs", err.logs);
    logger.log("ERR", err.err);
    callback(err, null);
  });
}


// END