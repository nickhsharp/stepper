"use strict";

let utils = require("utils");

module.exports = {
  init: function(configs) {
    let dynamo = new configs.AwsSdk.DynamoDB(configs.aws);
    let docs = new configs.AwsSdk.DynamoDB.DocumentClient(configs.aws);

    function putActivity(params) {
      /*
        params = {
          taskToken: activity.taskToken,
          payload: payload,
          type: SubStep|QueryableActivity|Lambda|ParallelEach
        }
      */

      /*
      TODO: if they set a Timeout in the instructions
      we might want to put that as well and actually enable it as a TTL
      but then we have to get into Dynamo TTL,
      so we're aiming for using ScheduledEvent or Heartbeater for this
      */

      params.internalToken = params.internalToken || utils.UID.v4();
      params.createdTimestamp = `${Date.now()}`;

      return docs.put({
        TableName : configs.dynamo.internalTasks,
        Item: params
      }).promise().then(() => {
        return params.internalToken;
      });
    }

    function getInternalTokens(count) {
      /*
        Placeholder and Promise for if this process would need
        to be asynch or store internals in database etc.
      */
      let tokens = [];
      for(let i = 0; i < count; i++) {
        tokens.push(utils.UID.v4())
      }
      return Promise.resolve(tokens);
    }

    return Object.freeze({
      putActivity: putActivity,
      getInternalTokens: getInternalTokens,
    });
  }
}


// END