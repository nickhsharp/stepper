"use strict";

const utils = require("../../lib/utils");
const logger = require("../../lib/logger");

const rules = require("./rules");
const comparisons = require("./comparisons");

function ruleCheck(event, ruleDef) {
  /*
    Supports only a single rule at this point in time.
    But since that rule can contain multiples I don't see
    the need to expand to multiple rules in the State Definition,
    you would do the composition inside of the rules.js
  */
  let ruleName = Object.keys(ruleDef)[0];
  let options = ruleDef[ruleName].Choices;

  let successNext, failNext;
  ruleDef[ruleName].Choices.forEach((option) => {
    if(option.BooleanEquals) {
      successNext = option.Next;
    } else {
      failNext = option.Next;
    }
  })

  if(!rules[ruleName]) {
    return Promise.resolve(rules.ruleNotFound(event)).then((ret) => {
      return {
        decision: "Default",
        reasons: [ret.failure]
      }
    });
  }

  return Promise.all(rules[ruleName].map((rule) => {
    return Promise.resolve(rule(event));
  })).then((ret) => {
    let success = true;
    let reasons = [];

    ret.forEach((item) => {
      if(!item.success) {
        success = false;
        reasons.push(item.failure)
      }
    })

    if(success) {
      return {
        decision: successNext,
        reasons: reasons
      }
    } else {
      return {
        decision: failNext,
        reasons: reasons
      }
    }
  }).catch((err) => {
    logger("Rule Catch", err);
    return {
      decision: failNext,
      reasons: [err]
    }
  }) 
  
};

function evaluator(event, choice) {
  if(choice.And) {

    let every = choice.And.every((inner) => {
      return evaluator(event, inner);
    });

    if(every) {
      return {
        decision: choice.Next,
        reasons: [choice]
      };
    }

  } else if (choice.Or) {

    let some = choice.Or.some((inner) => {
      return evaluator(event, inner);
    });

    if(some) {
      return {
        decision: choice.Next,
        reasons: [choice]
      };
    }

  } else if(choice.Not) {

    let not = evaluator(event, choice.Not);

    if(!not) {
      return {
        decision: choice.Next,
        reasons: [choice]
      };
    }

  } else {

    let a = utils.DOT.get(event, choice.Variable);

    for(let key in choice) {

      if(key != "Variable" && key != "Next" && comparisons[key]) {
        let b;
        if(typeof choice[key] === 'string' && choice[key].indexOf("$.") === 0) {
          b = utils.DOT.get(event, choice[key])
        } else {
          b = choice[key];
        }

        let decision = comparisons[key](a, b);

        if(decision) {
          return {
            decision: choice.Next,
            reasons: [choice]
          };
        }
      }
    }

    return false;
  }

  return false;
}

function evaluatorCheck(event, choices) {
  return Promise.resolve().then(() => {
    let ret = {
      decision: "Default",
      reasons: ["Did not match any Choices"]
    };
    let pass = choices.some((choice) => {
      let evaluation = evaluator(event, choice);
      ret = evaluation || ret;
      return evaluation;
    });

    return ret;
  }).catch((err) => {
    logger("Evaluator Catch", err);
    return {
      decision: "Default",
      reasons: [err]
    }
  });
}

module.exports.handler = (event, context, callback) => {
  let decisionPath = utils.DOT.get(event, event.meta.decider.ResultPath);
  let reasonPath = `${decisionPath}Reasons`;
  let check;
  
  if (event.meta.decider && event.meta.decider.Rules) {
    check = ruleCheck(event, event.meta.decider.Rules);
  } else if(event.meta.decider && event.meta.decider.Choices) {
    check = evaluatorCheck(event, event.meta.decider.Choices);
  } else {
    check = Promise.resolve({
      decision: "Default",
      reasons: ["Bad StepChooser Definition"]
    });
  }

  check.then((res) => {
    utils.DOT.set(event, decisionPath, res.decision);
    utils.DOT.set(event, reasonPath, res.reasons);

    return callback(null, event.meta);
  });
};

//END
