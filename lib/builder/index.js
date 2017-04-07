"use strict";

function getGenericCatcher(configs, resultPath, target = "DeadLetter:Activity:ShimPass") {
  if(configs.slim) {
    return "";
  }

  return `
  "Catch": [
    {
      "ErrorEquals": [
        "NoRetryCloser"
      ],
      "ResultPath": "${resultPath}",
      "Next": "Closer:Send"
    },
    {
      "ErrorEquals": [
        "States.ALL"
      ],
      "ResultPath": "${resultPath}",
      "Next": "${target}"
    }
  ],`
}

function getGenericRetry(configs, interval = 5, attempts = 3) {
  if(configs.slim) {
    return "";
  }

  return `
  "Retry": [
    {
      "ErrorEquals": [
        "NoRetryCloser"
      ],
      "MaxAttempts": 0
    },
    {
      "ErrorEquals": [
        "States.ALL"
      ],
      "IntervalSeconds": ${interval},
      "MaxAttempts": ${attempts},
      "BackoffRate": 2.1
    }
  ],`
}

function getDeadLetter(configs) {
  if(configs.slim) {
    return "";
  }

  return `,

    "DeadLetter:Activity:ShimPass": {
      "Type": "Pass",
      "Result": {
        "Resource": "arn:aws:states:${configs.region}:${configs.account}:activity:replication-trigger-deadletter",
        "InputPath": "$.data",
        "Queryable": "$.meta.queryable",
        "Type": "QueryableActivity",
        "Targets": ${JSON.stringify(configs.deadLetterTargets)}
      },
      "ResultPath": "$.meta.instructions",
      "Next": "DeadLetter:Activity"
    },

    "DeadLetter:Activity": {
      "Type": "Task",
      "Resource": "arn:aws:states:${configs.region}:${configs.account}:activity:replication-trigger-deadletter",
      "Next": "DeadLetter:Choice"
    },

    "DeadLetter:Choice": {
      "Type": "Choice",
      "Choices": [${configs.deadLetterTargetChoices}],
      "Default": "Closer:Send"
    }`
}

function getCloser(configs) {
  if(configs.slim) {
    return `,

      "Closer:Send": {
        "Type": "Succeed"
      }
    `;
  }

  return `,

    "Closer:Send": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:${configs.region}:${configs.account}:function:SubStepCloser:${configs.alias}",
      "ResultPath": "$.meta.status",
      ${getGenericRetry(configs)}
      ${getGenericCatcher(configs, "$.errors.CloserSend")}
      "Next": "Closer:Choice"
    },

    "Closer:Choice": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.meta.status.message",
          "StringEquals": "SUCCEEDED",
          "Next": "Closer:Success"
        }
      ],
      "Default": "Closer:Fail"
    },

    "Closer:Success": {
      "Type": "Succeed"
    },

    "Closer:Fail": {
      "Type": "Fail",
      "Error": "Closer:Fail",
      "Cause": "Closer:Fail - see $.errors for details"
    }`
}

module.exports = {
  getGenericCatcher: getGenericCatcher,
  getGenericRetry: getGenericRetry,
  getDeadLetter: getDeadLetter,
  getCloser: getCloser,
}

