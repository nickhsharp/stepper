"use strict";

const TYP = require("./typ.js");
const DOT = require("./dot.js");

function get(obj, path) {
  return {};
}

function set(obj, path, add) {
  return obj;
}

module.exports = {
  get: get,
  set: set,
};
