"use strict";

const ruleKeeper = require('@welocalize/rule-keeper');
const {DOT} = require("../lib/utils");

const comparisons = {
  StringEquals: (a, b) => {
    return a === b;
  },
  StringLessThan: (a, b) => {
    return a < b;
  },
  StringGreaterThan: (a, b) => {
    return a > b;
  },
  StringLessThanEquals: (a, b) => {
    return a <= b;
  },
  StringGreaterThanEquals: (a, b) => {
    return a >= b;
  },
  NumericEquals: (a, b) => {
    return a === b;
  },
  NumericLessThan: (a, b) => {
    return a < b;
  },
  NumericGreaterThan: (a, b) => {
    return a > b;
  },
  NumericLessThanEquals: (a, b) => {
    return a <= b;
  },
  NumericGreaterThanEquals: (a, b) => {
    return a >= b;
  },
  BooleanEquals: (a, b) => {
    return a === b;
  },
  TimestampEquals: (a, b) => {
    return a === b;
  },
  TimestampLessThan: (a, b) => {
    return a < b;
  },
  TimestampGreaterThan: (a, b) => {
    return a > b;
  },
  TimestampLessThanEquals: (a, b) => {
    return a <= b;
  },
  TimestampGreaterThanEquals: (a, b) => {
    return a <= b;
  }
}

function evaluator(event, choice) {
  event.meta.decisionReason = [];
  if(choice.And) {

    let every = choice.And.every((inner) => {
      return evaluator(event, inner);
    });

    if(every) {
      event.meta.decision = choice.Next;
      event.meta.decisionReason.push(choice);
      return true;
    }

  } else if (choice.Or) {

    let some = choice.Or.some((inner) => {
      return evaluator(event, inner);
    });

    if(some) {
      event.meta.decision = choice.Next;
      event.meta.decisionReason.push(choice);
      return true;
    }

  } else if(choice.Not) {

    let not = evaluator(event, choice.Not);

    if(!not) {
      event.meta.decision = choice.Next;
      event.meta.decisionReason.push(choice);
      return true;
    }

  } else {

    let a = DOT.get(event, choice.Variable);

    for(let key in choice) {

      if(key != "Variable" && key != "Next" && comparisons[key]) {
        let b;
        if(typeof choice[key] === 'string' && choice[key].indexOf("$.") === 0) {
          b = DOT.get(event, choice[key])
        } else {
          b = choice[key];
        }

        let decision = comparisons[key](a, b);

        if(decision) {
          event.meta.decision = choice.Next;
          event.meta.decisionReason.push(choice);
          return true;
        }
      }
    }

    return false;
  }

  return false;
}

/*
  "Rules": {
    "RequestHasRequiredInfoForProgram": { //This is the name of the rule or ruleSet as defined in the rule project.
      "Choices": [ //These determine the path to take based on the results of the rule evaluation.
        {
          "BooleanEquals": true,
          "Next": "Prep:Containers:Start"
        },
        {
          "BooleanEquals": false,
          "Next": "QueryableActivity:Prep:Request:Gather:ShimPass"
        }
      ]
    }
  },
 */
function ruleCheck(event, ruleDef) {
  let ruleSetName = Object.keys(ruleDef)[0];
  return ruleKeeper.checkRules(ruleSetName, event).then(decision => {
    let choice = ruleDef[ruleSetName].Choices.filter(x => x.BooleanEquals === decision.success);
    let formattedResultPath = event.meta.decider.ResultPath.replace('$.', '');
    if (decision.success) {
      event.meta.decision = choice[0].Next;
      event.meta.decisionReason = ruleSetName;
      DOT.set(event, formattedResultPath, choice[0].Next);
      return true;
    } else {
      event.meta.decision = choice[0].Next;
      event.meta.decisionReason = decision.failures;
      DOT.set(event, formattedResultPath, choice[0].Next);
      return false;
    }
  }).catch(err => {
    console.log('Error checking rules: ', err);
    return false;
  });
};

/*
  Example

  {
    bar: "asdf",
    bing: "zzz",


    meta: {
      decider: {
        "Rules": {
          "RequestHasRequiredInfoForProgram": {
            "Choices": [
              {
                "BooleanEquals": true,
                "Next": "Prep:Containers:Start"
              },
              {
                "BooleanEquals": false,
                "Next": "QueryableActivity:Prep:Request:Gather:ShimPass"
              }
            ]
          }
        },
        Choices: [
          {
            Variable: "$.foo",
            StringEquals: "$.bar",
            Next: "BAR"
        },
          {
            Variable: "$.foo",
            StringLessThan: "$.bing",
            Next: "BING"
        },
          {
            Not: {
              Variable: "$.foo",
              StringLessThan: "$.bar",
            },
            Next: "NOT"
        },
          {
            And: [
              {
                Variable: "$.foo",
                StringLessThan: "$.bar",
            },
              {
                Variable: "$.foo",
                StringEquals: "$.bing",
            }
          ],
            Next: "AND"
        },
      ]
      }
    }
  }

*/

module.exports.handler = (event, context, callback) => {
  console.log("event", JSON.stringify(event));

  event.meta.decision = "Default";
  event.meta.decisionReason = "No matching rule or choice";
  if (event.meta.decider && event.meta.decider.Rules) {
    return ruleCheck(event, event.meta.decider.Rules).then(res => {
      console.log("Decision", event.meta.decision);
      console.log("Decision Reason", event.meta.decisionReason);
      return callback(null, event.meta);
    });
  } else if(event.meta.decider && event.meta.decider.Choices) {
    event.meta.decider.Choices.some((choice) => {
      return evaluator(event, choice);
    })
  }

  console.log("Decision", event.meta.decision);
  console.log("Decision Reason", event.meta.decisionReason);
  callback(null, event.meta);
};
