"use strict";

let utils = require("utils");

module.exports = {
  init: function(configs) {
    let step = new configs.AwsSdk.StepFunctions(configs.aws);
    let lambda = new configs.AwsSdk.Lambda(configs.aws);

    function getActivityTask(params) {
      /*
        params = {
          arn: string,
          workerName: string
        }
      */
      //console.log("getActivityTask", params)
      return step.getActivityTask({
        activityArn: params.arn,
        workerName: params.workerName,
      }).promise();
    }

    function sendTaskFailure(params) {
      /*
        params = {
          taskToken: string,
          cause: string,
          error: string,
        }
      */
      //console.log("sendTaskFailure", params.taskToken)
      return step.sendTaskFailure({
        taskToken: params.taskToken,
        cause: params.cause,
        error: params.error,
      }).promise();
    }

    function sendTaskSuccess(params) {
      /*
        params = {
          taskToken: string,
          output: object
        }
      */

      //console.log("sendTaskSuccess", params.taskToken);
      return step.sendTaskSuccess({
        taskToken: params.taskToken,
        output: utils.LOG.stringify(params.output),
      }).promise();
    }

    function stepStarter(params) {
      /*
        params = {
          initial: {},
          meta: {
            name: "name guid to start with",
            arn: "arn to start",

            // optionals
            stage: "step stage to start",
            alias: "step alias to start",
            version: "step version to start",
            region: "step region to use",
            // optionals

            taskToken: "internal task Token",
            parent: {
              name: "name guid of the parent calling step functio",
              arn: "arn of the parent calling step function"

              // optionals
              stage: "step stage to start",
              alias: "step alias to start",
              version: "step version to start",
              region: "step region to use",
              // optionals
            }
          }
        }
      */

      //console.log("stepStarter", params)
      return lambda.invoke(params).promise();
    }

    function lambdaStarter(params) {
      console.log("lambdaStarter", params)
      return Promise.resolve();
    }

    return Object.freeze({
      getActivityTask: getActivityTask,
      sendTaskFailure: sendTaskFailure,
      sendTaskSuccess: sendTaskSuccess,
      stepStarter: stepStarter,
      lambdaStarter: lambdaStarter,
    });
  }
}


// END