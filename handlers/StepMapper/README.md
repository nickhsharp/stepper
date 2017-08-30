# Step Mapper

## Desired Structure

### Simple Mapping
When you want to map data from one pointin the $ structure to another:
```json
{
  "Type": "Mapper",
  "Map": {
    "$.faa": "$.bar.baz[1]",
    "$.bing": "$.asdf"
  },
  "Next": "Next"
}
```

### List-Ish Mapping Helpers
Helpers for handling "list-ish" objects like arrays:

#### Map - equivalent to Array.map
```json
{
  "Type": "Mapper",
  "Map": {
    "$.faa": {
      "Helper": "Map",
      "Result": {
        "$.foo": "$.bar",
        "$.bing.baz": "$.buzz.ber" 
      }
    },
    "$.bing": "$.asdf"
  },
  "Next": "Next"
}
```

#### Filter - equivalent to Array.filter
```json
{
  "Type": "Mapper",
  "Map": {
    "$.faa": {
      "Helper": "Filter",
      "Choice": {
        "Variable": "$.meta.decision",
        "StringEquals": "NextState1"
      }
    },
    "$.bing": "$.asdf"
  },
  "Next": "Next"
}

{
  "Type": "Mapper",
  "Map": {
    "$.faa": {
      "Helper": "Filter",
      "Choice": {
        "And": [
          {
            "Variable": "$.quote.required",
            "BooleanEquals": true
          },
          {
            "Variable": "$.quote.review",
            "BooleanEquals": false
          }
        ]
      }
    },
    "$.bing": "$.asdf"
  },
  "Next": "Next"
}
```

#### Sort - equivalent to Array.sort
```json
{
  "Type": "Mapper",
  "Map": {
    "$.faa": {
      "Helper": "Sort",
      "Key": "$.sortkey"
    },
    "$.bing": "$.asdf"
  },
  "Next": "Next"
}
```

## Reasons for Shim

### 1. Pass States can only map a single top level item, requiring either a customer Lambda just to map together an object, or a chain of Pass States

## The Shim
The basis of this Shim lies in delegating the mapping logic to a Lambda, since this functionality doesn't exist yet.
1. A ShimPass "Pass" state which defines the instructions for the StepMapper Lambda.  This allows the StepMapper Lambda itself to be stateless, and it obeys mapping instructions.  Instructions use $.meta concvention for their location in the $ object.
2. The StepMapper "Task" state, which calls the Lambda, providing the current state "$", and expecting back a "$"

Having deployed the lamdbda handler in /handlers/StepMapper, you would then modify your Step Function to look more like the following:

### Using ShimPass
```json
{
  "StepMapper:ShimPass": {
    "Type": "Pass",
    "Result": {
      "Map": {
        "$.faa": "$.bar.baz[1]",
        "$.bing": "$.asdf"
      },
    },
    "ResultPath": "$.meta.mapper",
    "Next": "StepMapper:Chooser"
  },

  "StepMapper:Mapper": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:::function:StepMapper",
    "ResultPath": "$.meta",
    "End": true
  }
}
```

{
  bar: {
    baz: [
      "value2", "value1"
    ]
  },
  asdf: "asdf-text",
  meta: {
    mapper: {
      "Map": {
        "$.result.code": "$.currentLock.code",
        "$.result.actions": "$.parallelResults.actions",
      },
    }
  }
}

{
  bar: {
    baz: [
      "value2", "value1"
    ]
  },
  asdf: "asdf-text",
  Result: {
    asdfasdf
  }
}

## Notes
1. The design of StepMapper is to be logicless and usable accross ALL Step Functions. 

