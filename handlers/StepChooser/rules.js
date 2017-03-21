"use strict";

const utils = require("../../lib/utils");

function buildFailure(name, failureMessage) {
  return {
    success: false,
    failure: {
      rule: name,
      message: failureMessage,
    },
  };
}

function ruleNotFound(obj) {
  return buildFailure("Rule Not Found", "rule or ruleSet does not exist");
}

function objectIsTruthy(obj) {
  if (!obj) {
    return buildFailure("Object Is Truthy", "object is not truthy");
  }

  return {
    success: true
  };
}

function objectIsObject(obj) {
  if (!utils.TYP.isObject(obj)) {
    return buildFailure("Object is Object", "object is not an object");
  }

  return {
    success: true
  };
}

module.exports = {
  ruleNotFound: [
    ruleNotFound
  ],
  TestRuleSet: [
    objectIsTruthy,
    objectIsObject
  ]
};


//END