"use strict";

let utils = require("../../lib/utils");

module.exports.handler = (event, context, callback) => {
  //take out the first branch to save the original input
  let input = event.splice(0, 1)[0];
  // event now contains the two real branches

  // we need instructions on where to put... this is what the Parallel.ResultPath should do
  if(input.meta && input.meta.ParallelResultPath) {
    // limited JSON path set.  supports object and array notation
    utils.DOT.set(input, input.meta.ParallelResultPath, event)
    // at this point input has been injected with what should the output of parallel.ResultPath
  }

  // clean up meta instructions in case of step function looping or retry
  delete input.meta.ParallelResultPath;

  callback(null, input);
};
