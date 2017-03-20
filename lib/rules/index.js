"use strict";

const {TYP} = require("../utils");

function formatOutput(ruleCheckresults) {
  let results = TYP.isArray(ruleCheckresults) ? ruleCheckresults : [ruleCheckresults];
  let toReturn = {
    success: true
  };
  
  toReturn.success = (results.filter(x => x.success === false).length === 0) ? true : false;
  toReturn.failures = [];
  results.forEach(result => {
    if (result.failure) {
      toReturn.failures.push(result.failure);
    }
  });
  return toReturn;
}

const predefinedRules = require('../rules/rules');

const isAry = x => TYP.isArray(x);
const toAry = x => isAry(x) ? x : [x];
const sortByPriority = x => x.sort(function(a, b) {
  return (a.priority > b.priority) ? 1 : ((b.priority > a.priority) ? -1 : 0);
});
/*
  {
   success: false,
   failures: [
      {
        rule: "hasFiles",
        message: "This request requires files",
      },
      {
        rule: "atLeastOneFileMarkedPatent",
        message: "At lease one file must be a patent",
      },
      {
        rule: "hasLocPairs",
        message: "This request requires loc pairs",
      },
    ],
  });
 */

function checkRules(rules, fact, opts) {
  let parallel = (opts && opts.hasOwnProperty('parallel')) ? opts.parallel : true;
  let prioritize = (opts && opts.hasOwnProperty('prioritize')) ? opts.prioritize : true;
  let failFast = (opts && opts.hasOwnProperty('failFast')) ? opts.failFast : true;
  let ruleSet = loadRules(rules, prioritize);
  let toExecute;

  if (parallel) {
    toExecute = Promise.resolve().then(() => {
      return queen.parallel(ruleSet, rule => {
        let result = rule.rule(fact);
        if (failFast && !result.success) {
          return Promise.reject(result);
        } else {
          return Promise.resolve(result);
        }
      });
    });
  } else {
    toExecute = Promise.resolve().then(() => {
      return queen.sequential(ruleSet, rule => {
        let result = rule.rule(fact);
        if (failFast && !result.success) {
          return Promise.reject(result);
        } else {
          return Promise.resolve(result);
        }
      });
    });
  }

  return toExecute.then(formatOutput, formatOutput);
}

function loadRules(rules, prioritize) {
  let ruleSet;
  if (typeof rules === 'string') {
    if (!predefinedRules[rules]) {
      ruleSet = toAry(predefinedRules.ruleNotFound);
    } else {
      ruleSet = prioritize ? sortByPriority(toAry(predefinedRules[rules])) : toAry(predefinedRules[rules]);
    }
  } else {
    ruleSet = prioritize ? sortByPriority(toAry(rules)) : toAry(rules);
  }

  return ruleSet;
}

module.exports = {
  checkRules,
};
