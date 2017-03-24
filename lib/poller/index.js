"use strict";

const logger = require("../utils/log");

module.exports = {

  init: function(configs, conns) {
    let pollerName;
  
    function createProceedCheck(memoryLimitInMB, getRemainingTimeInMillis, name) {
      let memoryThreshold = memoryLimitInMB - (memoryLimitInMB * 0.1);
      pollerName = name;
      return function proceedCheck() {
        if(getRemainingTimeInMillis() <= 70000) {
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
    };

    function doPoll(arn, proceedCheck, handler, logs) {
      logs = logs || {};
      logs[arn] = logs[arn] || {
        polls: 0,
        handled: 0,
        recieved: 0,
      };
    
      return Promise.resolve().then(() => {
        if(proceedCheck()) {
          logs[arn].polls++;

          return conns.getActivityTask({
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

            return handler(arn, activity).then(() => {
              logs[arn].handled++;
            });

          }).then(() => {
            return doPoll(arn, proceedCheck, handler, logs);
          })
        } else {
          logger.log("proceedCheck:false", arn)
          return Promise.resolve(logs);
        }
      }).catch((err) => {
        return Promise.reject({
          err: err,
          logs: logs
        });    
      })
    }

    return Object.freeze({
      doPoll: doPoll,
      createProceedCheck: createProceedCheck,
    });
  }
}

// END