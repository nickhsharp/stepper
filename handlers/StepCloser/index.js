"use strict";

const AWS = require('aws-sdk');
const step = new AWS.StepFunctions({
  region: 'us-west-2',
});

module.exports.handler = (event, context, callback) => {
  // if execution was not a Sub Step then no-op return;
  if(!event.meta || !event.meta.taskToken) {
    return callback(null);
  } 

  // default success condition is true
  let method = "sendTaskSuccess";
  if(event.meta.success === false) {
    method = "sendTaskFailure";
  } else {
    // set onto the returned event, because Choice states are frustratingly strict
    event.meta.success = true;
  }

  // invoke the Success or Failure of the Activity from the Parent Step Function
  return step[method]({
    taskToken: event.meta.taskToken,
    output: JSON.stringify(event.report),
  }).promise().then(() => {
    callack(null, event);
  }).catch((err) => {
    callback(err);
  });
}