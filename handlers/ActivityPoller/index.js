"use strict";

let pollerName = "ActivityPoller";

process.env.REQUIREROOT = process.env.REQUIREROOT || "../";
/*
  START: Dependencies.
*/
const logger = require("utils/lib/log");
const configs = require(process.env.REQUIREROOT + "../scripts/configs.json");
configs.AwsSdk = require("aws-sdk");

/*
  Freeze configs so down stream types don't mess with it and hurt others
*/
Object.freeze(configs);

const conns = require(process.env.REQUIREROOT + "../lib/conns").init(configs);
const data = require(process.env.REQUIREROOT + "../lib/data").init(configs);

const act = require(process.env.REQUIREROOT + "../lib/activities").init(configs, data, conns);
const poller = require(process.env.REQUIREROOT + "../lib/poller").init(configs, conns);
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
    `ActivityPoller:${context.awsRequestId}`); 

  /*
    Define the individual activity instance handler and inject it
  */
  function handler(arn, activity) {
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
    return act.handleActivity(arn, activity);
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
    logger.log("LOGS", err.logs);
    logger.log("ERR", err.err);
    callback(err, null);
  });
}


// END