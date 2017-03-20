"use strict";

const ava = require("ava");
const {test, } = ava;

const act = require("../act.js");

test("exposes a .init function", t => {
  t.plan(1);

  t.is(typeof act.init, 'function');
});