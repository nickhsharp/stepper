# Parallel Cleaner

## Reason
At the point of writing this (3/20/2017), Parallel States did not support ResultPath on the Parallel itself.  This means that in using a Parallel you will "lose" access to your initial input state if it were an object.  The state language specification specifically mentions the intent of supporting ResultPath on Parallels, and without this functionality they are significantly less useful.

## Desired Structure
```json
{
  "ParallelTest": {
    "Type": "Parallel",
    "Branches": [
      {
        "StartAt": "Branch1",
        "States": {
          "Branch1": {
            "Type": "Pass",
            "Result": {
                "branch1": true
            },
            "ResultPath": "$.branch1.output",
            "OutputPath": "$.branch1.output",
            "End": true
          }
        }
     },
      {
        "StartAt": "Branch2",
        "States": {
          "Branch2": {
            "Type": "Pass",
            "Result": {
                "branch2": true
            },
            "ResultPath": "$.branch2.output",
            "OutputPath": "$.branch2.output",
            "End": true
          }
        }
      }
    ],
    "ResultPath": "$.parallelResult",
    "Next": "Closer"
  }
}
```

## Expected Results
Provided an input of:
```json
{
  "branch1": {
    "input": "branch1Input"
  },
  "branch2": {
    "input": "branch2Input"
  }
}
```
We would expect an output of:
```json
{
  "branch1": {
    "input": "branch1Input"
  },
  "branch2": {
    "input": "branch2input"
  },
  "parallelResult": [
    {
      "branch1": true
    }, {
      "branch2": true
    }
  ]
}
```

## Shim
Having deployed the lamdbda handler in /handlers/StepParallelCleaner, you would then modify your Step Function to look more like the following:
```json
{
  "ShimPass": {
    "Type": "Pass",
    "Result": "$.desired",
    "ResultPath": "$.parallelResult",
    "Next": "DoParallel"
  },
  "DoParallel": {
    "Type": "Parallel",
    "Branches": [
      {
        "StartAt": "ShimPass",
        "States": {
          "ShimPass": {
            "Type": "Pass",
            "End": true
          }
        }
      },
      {
        "StartAt": "Branch1",
        "States": {
          "Branch1": {
            "Type": "Pass",
            "InputPath": "$.branch1.input",
            "ResultPath": "$.branch1.output",
            "OutputPath": "$.branch1.output",
            "End": true
          }
        }
      },
      {
        "StartAt": "Branch2",
        "States": {
          "Branch2": {
            "Type": "Pass",
            "InputPath": "$.branch1.input",
            "ResultPath": "$.branch1.output",
            "OutputPath": "$.branch1.output",
            "End": true
          }
        }
      }
    ],
    "ResultPath": "$.parallelResult",
    "Next": "CleanerLambda"
  },
  "CleanerLambda": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:::function:StepParallelCleaner",
    "Next": "Closer"
  }
}
```
Thus, with the addition of a ShimPass "Pass" state to provide the instructions to our StepParallelCleaner lambda, we can use Parallels as they were intended and retain our state input structure without the Parallel State overwriting it to an array.

Whenever this gets fixed, the removal of the Shim would be to delete the ShimPass, CleanerLambda and first Branch of ParallelTest, and rewire the Step Function into and out of ParallelTest.

