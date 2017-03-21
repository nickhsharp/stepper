# Step Chooser


## Desired Structure

### Lambda Task Routing
When the Lambda has domain knowledge to control the routing:
```json
{
  "Type": "Task",
  "Resource": "arn:aws:lambda:::function:LogicalRouter",
  "Next": "$.routing.target"
}
```

### State to State Comparisons
When you desire to compare an execution state property to another:
```json
{
  "Type": "Choice",
  "Choices": [
    {
      "Variable": "$.foo",
      "NumericGreaterThan": "$.bar",
      "Next": "NextState1"
    },
    {
      "Variable": "$.bong",
      "NumericGreaterThanEquals": "$.baz",
      "Next": "NextState1"
    }
  ],
  "Default": "DefaultState"
}
```

### Rules
When you desire to encapsulate a rule set -a Javascript function with a specific contract- but said rule set didn't seem worth its own Lambda Function that would have to know and obey the StepChooser result contract:
```json
{
  "Type": "Choice",
  "Rules": {
    "RuleSetOne": {
      "Choices": [
        {
          "BooleanEquals": true,
          "Next": "NextState1"
        },
        {
          "BooleanEquals": false,
          "Next": "NextState2"
        }
      ]
    }
  },
  "Default": "DefaultState"
}
```

## Reasons for Shim

### 1. Choice States are Broken
Current Choice blocks are picky about existence of the attribute you select in the "Variable" field.  For example, if you provide $.foo.bar, and $.foo does not exist or is not an object, the Choice state will "throw", even if there is a second Choice which would pass based on entirely different variables.  

By throw I mean a hard non-recoverable throw - since Choice States CANNOT have a Catch- not just proceeding to the default.  You'll be left with a completely dead execution and a lovely error like this as the last thing you see.

This is referred to as "ChoiceCatchBug" in our documentation, and there is a test suite for this behaviour's resolution.
```
ExecutionFailed
{"error":"States.Runtime","cause":"An error occurred while executing the state 'ChoiceState' (entered at the event id #2). Invalid path: The choice state's condition path references an undefined value."}
```
Choice States are essentially non usable in their current form.  They must either allow a Catch block, or proceed to the Default Choice in the case of an error.

### 2. Choice States are Rigid
Choice blocks allow the comparisons of execution state against static values.  For example:
```json
{
  "Variable": "$.foo",
  "NumericGreaterThan": 2,
  "Next": "NextState"
}
```
We wanted to be able to compare execution state property against another execution state property.  This would allow a more condensed step definition, and allow run time configurable tuning.  For example: consider the scenario where you want to loop an Activity or Lambda Task State until the output exceeds a quality threshold.
```json
{
  "Variable": "$.quality",
  "NumericGreaterThan": 95,
  "Next": "NextState"
}
```
But then you have another business workflow that is identical to the first, with the exception that their quality threshold is 80.  Using native Choices you would have to make an "And" block inside of the choices, with hardcoded account_id's linked to that accounts quality threshold?
```json
{
  "And": [
    {
      "Variable": "$.quality",
      "NumericGreaterThan": 95,
    },
    {
      "Variable": "$.account_id",
      "StringEquals": "1234"
    }
  ],
  "Next": "NextState"
}
```
This would scale out of bounds quite quickly and lead into Reason 3, above and beyond the requirement to redeploy the Step Function for every change.  

### 3. Choice States are "Busy"
Choice definitions can be quite verbose.  Consider the following fairly simple Choice.  This Choice asks if we should send a quote or not, and should we provide internal review before sending or proceeding.
```json
{
  "Choices": [
    {
      "And": [
        {
          "Variable": "$.quote.required",
          "BooleanEquals": true
        },
        {
          "Variable": "$.quote.review",
          "BooleanEquals": true
        }
      ],
      "Next": "QuoteReviewThenSend"
    },
    {
      "And": [
        {
          "Variable": "$.quote.required",
          "BooleanEquals": true
        },
        {
          "Variable": "$.quote.review",
          "BooleanEquals": false
        }
      ],
      "Next": "QuoteSend"
    },
    {
      "And": [
        {
          "Variable": "$.quote.required",
          "BooleanEquals": false
        },
        {
          "Variable": "$.quote.review",
          "BooleanEquals": true
        }
      ],
      "Next": "QuoteReviewThenProceed"
    },
    {
      "And": [
        {
          "Variable": "$.quote.required",
          "BooleanEquals": false
        },
        {
          "Variable": "$.quote.review",
          "BooleanEquals": false
        }
      ],
      "Next": "ProceedWithoutReview"
    }
  ]
}
```
While not distressingly complex, there is a large amount of boilerplate for an otherwise simple decision.  The burden of Choice definition increases "non linearly" (fuzzy feeling definition) with the complexity of the decision itself.

### 4. Choices are the only State that can "Route"
As it currently stands, the only state which can be used to control the routing of your Step Function at run time is the Choice block.  In our idealized fantasy land, we would love it if the "Next" field could be a JsonPath which would be interpretted, allowing other States to switch the flow of the execution at runtime based on evaluations and state.

## The Shim
The basis of this Shim lies in delegating the decision logic to a Lambda, and relegating the actual "Next" routing to the a simplified Choice that follows. 
1. A ShimPass "Pass" state which defines the instructions for the StepChooser Lambda.  This allows the StepChooser Lambda itself to be stateless, and it obeys the "ResultPath" direction for where to place its decision.
2. The LambdaChooser "Task" state, which calls the Lambda, providing the current state "$", and expecting back a "$.meta" (following our internal payload structure convention)
3. The actual "Choice" state, which is now merely a "logicless" router since Choice continues to be the only State type which can switch its "Nexts".  

Having deployed the lamdbda handler in /handlers/StepChooser, you would then modify your Step Function to look more like the following:

### Task Routing
```json
{
  "LambdaChooser:ShimPass": {
    "Type": "Pass",
    "Result": {
      "Routes": [
        "NextState1",
        "NextState2",
        "DefaultState"
      ],
      "ResultPath": "$.meta.decision"
    },
    "ResultPath": "$.meta.decider",
    "Next": "LambdaChooser:Chooser"
  },

  "LambdaChooser:Chooser": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:::function:LogicalRouter",
    "ResultPath": "$.meta",
    "Next": "LambdaChooser::Choice"
  },

  "LambdaChooser:Choice": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState1",
        "Next": "NextState1"
      },
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState2",
        "Next": "NextState2"
      }
    ],
    "Default": "DefaultState"
  }
}
```

### State to State Comparisons
```json
{
  "LambdaChooser:ShimPass": {
    "Type": "Pass",
    "Result": {
      "Choices": [
        {
          "Variable": "$.foo",
          "NumericGreaterThan": "$.bar",
          "Next": "NextState1"
        },
        {
          "Variable": "$.bong",
          "NumericGreaterThanEquals": "$.baz",
          "Next": "NextState1"
        }
      ],
      "ResultPath": "$.meta.decision"
    },
    "ResultPath": "$.meta.decider",
    "Next": "LambdaChooser:Chooser"
  },

  "LambdaChooser:Chooser": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:::function:StepChooser",
    "ResultPath": "$.meta",
    "Next": "LambdaChooser::Choice"
  },

  "LambdaChooser:Choice": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState1",
        "Next": "NextState1"
      },
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState2",
        "Next": "NextState2"
      }
    ],
    "Default": "DefaultState"
  }
}
```
### Rules

```json
{
  "LambdaChooser:ShimPass": {
    "Type": "Pass",
    "Result": {
      "Rules": {
        "RuleSetOne": {
          "Choices": [
            {
              "BooleanEquals": true,
              "Next": "NextState1"
            },
            {
              "BooleanEquals": false,
              "Next": "NextState2"
            }
          ]
        }
      },
      "ResultPath": "$.meta.decision"
    },
    "ResultPath": "$.meta.decider",
    "Next": "LambdaChooser:Chooser"
  },

  "LambdaChooser:Chooser": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:::function:StepChooser",
    "ResultPath": "$.meta",
    "Next": "LambdaChooser:Choice"
  },

  "LambdaChooser:Choice": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState1",
        "Next": "NextState1"
      },
      {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState2",
        "Next": "NextState2"
      }
    ],
    "Default": "DefaultState"
  }
}
```

## Notes
1. The design of StepChooser is to be logicless and usable accross ALL Step Functions.  
2. The design of the StepRouter would be a lambda written with specific awarenes of the state, and thus specific to certain payload contracts.

