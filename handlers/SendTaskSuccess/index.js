"use strict";

process.env.REQUIREROOT = process.env.REQUIREROOT || "../";

const configs = require(process.env.REQUIREROOT + "../scripts/configs.json");
configs.AwsSdk = require("aws-sdk");
Object.freeze(configs);

const logger = require("utils/lib/log");
const conns = require(process.env.REQUIREROOT + "../lib/conns").init(configs);
const data = require(process.env.REQUIREROOT + "../lib/data").init(configs);

module.exports.handler = (event, context, callback) => {
  //NO OP FOR NOW
  callback(null, event);
}