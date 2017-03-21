"use strict";

const ava = require("ava");
const {test, } = ava;

const LOG = require("../log.js");

test("LOG has two functions", t => {
  t.is(typeof LOG.log, "function");
  t.is(typeof LOG.stringify, "function");
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ]
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ true, circularObj ];
  circularObj.other = {
    herp: "derp"
  }
  circularObj.more = {
    herp: circularObj
  }

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    true,
    "[Circular - root]"
  ],
  "other": {
    "herp": "derp"
  },
  "more": {
    "herp": "[Circular - root]"
  }
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let otherObj = {};
  otherObj.circularReg = otherObj;
  circularObj.otherObj = otherObj;

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ],
  "otherObj": {
    "circularReg": "[Circular - otherObj]"
  }
}`)
});

test("LOG.stringify is a safe stringify for circular madness", t => {
  let circularObj = {};
  circularObj.circularRef = circularObj;
  circularObj.list = [ circularObj, circularObj ];

  let otherObj = {};
  otherObj.circularReg = otherObj;
  circularObj.test = {
    otherObj: otherObj
  }

  let json = LOG.stringify(circularObj);

  t.is(json, `{
  "circularRef": "[Circular - root]",
  "list": [
    "[Circular - root]",
    "[Circular - root]"
  ],
  "test": {
    "otherObj": {
      "circularReg": "[Circular - otherObj]"
    }
  }
}`)
});


