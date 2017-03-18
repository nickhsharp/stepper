"use strict";

let utils = require("../utils");

module.exports = {
  init: function(configs) {
    let step = new configs.AwsSdk.StepFunctions(configs.aws);
    let lambda = new configs.AwsSdk.StepFunctions(configs.aws);

    function getActivityTask(params) {
      /*
        params = {
          arn: string,
          workerName: string
        }
      */
      console.log("getActivityTask", params)
      return Promise.resolve({});
    }

    function sendTaskFailure(params) {
      /*
        params = {
          taskToken: string,
          cause: string,
          error: string,
        }
      */
      console.log("sendTaskFailure", params)
      return Promise.resolve({});
    }

    function stepStarter(params) {
      /*
        params = {
          payload: object,
          target: string,
        }
      */
      console.log("stepStarter", params)
      return Promise.resolve({});
    }

    return Object.freeze({
      getActivityTask: getActivityTask,
      sendTaskFailure: sendTaskFailure,
      stepStarter: stepStarter,
    });
  }
}


// END