"use strict";

const TYP = require("./typ");

function stringify(obj) {
  let cache = new WeakMap();

  function replacer(key, obj) {
    key = key || "root";

    if(TYP.isArray(obj) || TYP.isObject(obj)) {
      if(cache.has(obj)) {
        return `[Circular - ${cache.get(obj)}]`;
      } else {
        cache.set(obj, key);
        return obj;
      }
    } 
    return obj;
  }

  let ret = JSON.stringify(obj, replacer, 2);

  cache = null;

  return ret;
}

function log(label, data) {
  let log = {};

  if (data instanceof Error) {
    log.error = data;
    log.stack = data.stack;
    return console.error(label, stringify(log)); // return to early exit function
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
    console.log(label, stringify(log));
  } else {
    console.log(label);
  }
}

module.exports = {
  log: log,
  stringify: stringify,
};

//END