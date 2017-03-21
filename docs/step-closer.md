# Step Closer

## Reason
As a point of pattern we end all of our lambdas with a "Closer" section.  This Closer serves as the "End" of all possible flows in the Step Function, and would be the target of a "Catch All" if such existed.  Closer assumes you will explicitely set a $.meta.status = false if the Step Function should be condidered a failure.

Closer allows composition of Step Functions into "Sub Steps" since it gives us a standard hook point for it, yet they are passive pass throughs should the Step Function not have been called as a Sub Step.

Closer is dependant on our standardized payload pattern.  The standardized payload also provides the $.meta hook point where most of the shim instructions are set.  $.meta.name and $.meata.arn also provide internal knowledge of the running execution, which otherwise is not exposed to the Step input state.

## Standardized Payload
```json
{
  "initial": {},
  "meta": {
    "name": "UUID of this execution",
    "arn": "arn of this execution"
    "parent": {
      "name": "UUID of the parent execution - if exists",
      "arn": "arn of the parent execution - if exists"
    }
  }
}
```

## Closer States
Having deployed the lamdbda handler in /handlers/StepParallelCleaner, you would then modify your Step Function to look more like the following:
```json
{
  "Closer:Send": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:us-west-2:379633348023:function:SubStepCloser",
    "ResultPath": "$.meta.status",
    "Retry": [
      {
        "ErrorEquals": [
          "States.ALL"
        ],
        "IntervalSeconds": 5,
        "MaxAttempts": 3,
        "BackoffRate": 2.1
      }
    ],
    "Catch": [
      {
        "ErrorEquals": [
          "States.ALL"
        ],
        "ResultPath": "$.errors.CloserSend",
        "Next": "QueryableActivity:DeadLetter:ShimPass"
      }
    ],
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
  }
}
```

## Notes
1. For Closer to work to allow Sub Step composition, you MUST ensure that you have "Caught" every possible failure point.  
2. Essentially: if/when Step Functions allow you to designate a "Catch All" route, that route should lead into Closer.
3. There MUST not be any path through the Step Function which does not lead to Closer.

