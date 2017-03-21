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