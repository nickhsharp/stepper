"use strict";

const configs = require("../../scripts/configs.json");
const logger = utils.LOG;

const AWS = require("aws-sdk");
const lambda = new AWS.Lambda(configs.aws);

module.exports.handler = (event, context, callback) => {
  // if execution was not a Sub Step then no-op return;
  if(!event.meta || !event.meta.taskToken ) {
    return callback(null);
  } 

  logger("Closing SubStep", event.meta)

  // default success condition is true
  let method = "sendTaskSuccess";
  if(event.meta.success === false) {
    method = "sendTaskFailure";
  } else {
    // set onto the returned event, because Choice states are frustratingly strict
    event.meta.success = true;
  }

  // invoke the Success or Failure to our internal taskToken lambdas
  // so that we can abstract ParallelEach amongst others
  return lambda.invoke({
    InvocationType: "Event",
    Payload: JSON.stringify({
      taskToken: event.meta.taskToken,
      output: event.report,
    }),
    FunctionName: method
  }).promise().then(() => {
    callback(null, event);
  }).catch((err) => {
    logger("Error calling closer.", err)
    callback(err, null);
  });
}