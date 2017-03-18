'use strict';

function _testString(item) {
  return typeof item === 'string';
}

function _testNumber(item) {
  return typeof item === 'number' && isFinite(item);
}

function _testInteger(item) {
  return (typeof item === 'number') && item % 1 === 0;
}

function _testBoolean(item) {
  return typeof item === 'boolean';
}

function _testArray(item) {
  return Array.isArray(item);
}

function _testNull(item) {
  return item === null;
}

function _testDate(item) {
  return item instanceof Date;
}

function _testAny(item) {
  return true;
}

function _testObject(item) {
  return item && (typeof item) === 'object' && !Array.isArray(item) && !(item instanceof Date);
}

module.exports = {
  isString: _testString,
  isNumber: _testNumber,
  isInteger: _testInteger,
  isArray: Array.isArray,
  isBoolean: _testBoolean,
  isNull: _testNull,
  isDate: _testDate,
  isAny: _testAny,
  isObject: _testObject,
};
