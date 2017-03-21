"use strict";

const util = require("util");
const options = {
  depth: null,
}

function log(label, data) {
  let log = {};

  if (data instanceof Error) {
    log.error = data;
    log.stack = data.stack;
    return console.error(label, util.inspect(log, options)); // return to early exit function
  }

  // see if it's already been stringified so we don't double-stringify
  // add as "input" property if it's just a regular old string
  if (typeof data === 'string' || data instanceof String) {
    try {
      log = JSON.parse(data);
    } catch (e) {
      log.input = data;
    }
  } else {
    log = data;
  }

  if (log) {
    console.log(label, util.inspect(log, options));
  } else {
    console.log(label);
  }
}

module.exports = log;