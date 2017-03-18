"use strict";

let utils = require("../utils");

module.exports = {
  init: function(configs) {
    let dynamo = new configs.AwsSdk.DynamoDB(configs.aws);
    let docs = new configs.AwsSdk.DynamoDB.DocumentClient(configs.aws);

    function putActivity(params) {
      /*
        params = {
          taskToken: activity.taskToken,
          payload: payload,
          type: SubStep|QueryableActivity
        }
      */
      let internalToken = utils.UID.v4()

      console.log("putActivity", params);
      return Promise.resolve(internalToken);
    }


    return Object.freeze({
      putActivity: putActivity
    });
  }
}


// END