"use strict";

/*
  TEMP HACK TEST
*/
let handler = require("../index.js").handler;

let fakeSecondsLeft = 71
handler({}, {
  getRemainingTimeInMillis: function() {
    return fakeSecondsLeft-- * 1000;
  },
  memoryLimitInMB: 128,
  awsRequestId: "test"
}, (err, ret) => {
  //console.log(err, ret)
})