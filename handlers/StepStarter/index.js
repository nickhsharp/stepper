"use strict";

const configs = require("../../scripts/configs.json");

const UID = require("utils/lib/uid");
const DOT = require("utils/lib/dot");
const logger = require("utils/lib/log");

const AWS = require("aws-sdk");
const step = new AWS.StepFunctions(configs.aws);

/*
  It is actually easier to rebuild this lambda and re-deploy it. 
  Rather than have a runtime or cached lookup to some data store.
  We could of course upload and remotely store the registery, but the 
  effort didn't seem worth it or provide anything worthwhile.
*/
const registry = require("./registry.json");


/*
  {
    initial: {},
    meta: {
      name: "name guid to start with",
      arn: "arn to start",
      
      // optionals
      stage: "step stage to start",
      alias: "step alias to start",
      version: "step version to start",
      region: "step region to use",
      // optionals
      
      taskToken: "internal task Token",
      
      parent: {
        name: "name guid of the parent calling step functio",
        arn: "arn of the parent calling step function",

        // optionals
        stage: "step stage to start",
        alias: "step alias to start",
        version: "step version to start",
        region: "step region to use",
        // optionals
      }
    }
  }

*/
module.exports.handler = (event, context, callback) => {
  /*
    A helluva lot more schema validation forth coming
    @TODO: enforce entry and exit schema validation with JSON schema.
  */
  event.meta.stage = event.meta.stage || process.env.STAGE || "dev";
  event.meta.alias = event.meta.alias || "LATEST";
  event.meta.region = event.meta.region || context.invokedFunctionArn.split(":")[3];

  event.meta.name = event.meta.name || utils.UID.v1Sortable();
  
  /*
    Version is more specific than Alias and if set would be used
  */
  let alias = event.meta.alias;
  if (event.meta.version) {
    alias = `v${event.meta.version}`;
  }
  let lookup = `${event.meta.arn}.${event.meta.region}.${event.meta.stage}.${alias}`;

  let arn = utils.DOT.get(registry, lookup);
  if(!arn) {
    let err = new Error(`${lookup} not found.`);
    logger("Lookup Failed", err)
    callback(err, null);
    return;
  }

  /*
    Preserve the "slug" version of the arn,
    but update the actual meta of the real arn
    of the actual alias/version of the step
  */
  event.meta.genericArn = event.meta.arn;
  event.meta.arn = arn;

  return step.startExecution({
    stateMachineArn: arn,
    input: JSON.stringify(input),
    name: event.meta.name,
  }).promise().then((ret) => {
    callback(null, ret.data);
  })
  .catch((err) => {
    logger(`Error starting step function: ${arn}`, err);
    callback(err, null);
  });
};
