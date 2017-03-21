"use strict";

const configs = require("../../scripts/configs.json");
const utils = require("../../lib/utils");
const logger = utils.LOG;

const AWS = require("aws-sdk");
const step = new AWS.StepFunctions(configs.aws);

/*
  It is actually easier to rebuild this lambda and re-deploy it. 
  Rather than have a runtime or cached lookup to some data store.
  We could of course upload and remotely store the registery, but the 
  effort didn't seem worth it or provide anything worthwhile.
*/
const registry = require("./registry.json");

module.exports.handler = (event, context, callback) => {
  /*
    A helluva lot more schema validation forth coming
    @TODO: enforce entry and exit schema validation with JSON schema.
  */
  event.stage = event.stage || process.env.STAGE || 'dev';
  event.alias = event.alias || 'LATEST';
  event.name = event.name || utils.UID.v1Sortable();
  event.region = event.region || context.invokedFunctionArn.split(":")[3];

  /*
    Version is more specific than Alias and if set would be used
  */
  let alias = event.alias;
  if (event.version) {
    alias = `v${event.version}`;
  }
  let lookup = `${event.internalStateMachineArn}.${event.region}.${event.stage}.${alias}`;

  let arn = utils.DOT.get(registry, lookup);
  if(!arn) {
    let err = new Error(`${lookup} not found.`);
    logger("Lookup Failed", err)
    callback(err, null);
    return;
  }

  /*
    Preserve inputed meta in case there were parent name and parent arn.
  */
  event.input = event.input || {};
  event.input.meta = event.input.meta || {};
  event.input.meta.arn = arn;
  event.input.meta.name = event.name;

  return step.startExecution({
    stateMachineArn: arn,
    input: JSON.stringify(event.input),
    name: event.name,
  }).promise().then((ret) => {
    callback(null, ret.data);
  })
  .catch((err) => {
    logger(`Error starting step function: ${arn}`, err);
    callback(err, null);
  });
};
