"use strict";

const comparisons = {
  StringEquals: (a, b) => {
    return a === b;
  },
  StringLessThan: (a, b) => {
    return a < b;
  },
  StringGreaterThan: (a, b) => {
    return a > b;
  },
  StringLessThanEquals: (a, b) => {
    return a <= b;
  },
  StringGreaterThanEquals: (a, b) => {
    return a >= b;
  },
  NumericEquals: (a, b) => {
    return a === b;
  },
  NumericLessThan: (a, b) => {
    return a < b;
  },
  NumericGreaterThan: (a, b) => {
    return a > b;
  },
  NumericLessThanEquals: (a, b) => {
    return a <= b;
  },
  NumericGreaterThanEquals: (a, b) => {
    return a >= b;
  },
  BooleanEquals: (a, b) => {
    return a === b;
  },
  TimestampEquals: (a, b) => {
    return a === b;
  },
  TimestampLessThan: (a, b) => {
    return a < b;
  },
  TimestampGreaterThan: (a, b) => {
    return a > b;
  },
  TimestampLessThanEquals: (a, b) => {
    return a <= b;
  },
  TimestampGreaterThanEquals: (a, b) => {
    return a <= b;
  }
}

module.exports = comparisons;