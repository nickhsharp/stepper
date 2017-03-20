'use strict';

const ava = require('ava');
const {test, } = ava;

const TYP = require('../typ.js');

test('isString does just that', t => {

  t.truthy(TYP.isString('this is a string'));
  t.truthy(TYP.isString(''));
  t.truthy(TYP.isString('1234'));
  t.truthy(TYP.isString('true'));
  t.truthy(TYP.isString('false'));

  t.falsy(TYP.isString(123));
  t.falsy(TYP.isString(true));
  t.falsy(TYP.isString(false));
  t.falsy(TYP.isString({}));
  t.falsy(TYP.isString([]));
});

test('isNumber does just that', t => {

  t.truthy(TYP.isNumber(1234));
  t.truthy(TYP.isNumber(12.34));
  t.truthy(TYP.isNumber(-1.25));
  t.truthy(TYP.isNumber(-1000));
  t.truthy(TYP.isNumber(10 ^ 2));

  t.falsy(TYP.isNumber('123'));
  t.falsy(TYP.isNumber(true));
  t.falsy(TYP.isNumber(false));
  t.falsy(TYP.isNumber({}));
  t.falsy(TYP.isNumber([]));
});

test('isInteger does just that', t => {

  t.truthy(TYP.isInteger(1234));
  t.truthy(TYP.isInteger(-1000));
  t.truthy(TYP.isInteger(10 ^ 2));

  t.falsy(TYP.isInteger('123'));
  t.falsy(TYP.isInteger(true));
  t.falsy(TYP.isInteger(false));
  t.falsy(TYP.isInteger({}));
  t.falsy(TYP.isInteger([]));
  t.falsy(TYP.isInteger(1.2));
  t.falsy(TYP.isInteger(0.2));
  t.falsy(TYP.isInteger(-12.5));
});

test('isBoolean does just that', t => {

  t.truthy(TYP.isBoolean(true));
  t.truthy(TYP.isBoolean(false));

  t.falsy(TYP.isBoolean('123'));
  t.falsy(TYP.isBoolean('true'));
  t.falsy(TYP.isBoolean('false'));
  t.falsy(TYP.isBoolean({}));
  t.falsy(TYP.isBoolean([]));
  t.falsy(TYP.isBoolean(1.2));
  t.falsy(TYP.isBoolean(0.2));
  t.falsy(TYP.isBoolean(-12.5));
  t.falsy(TYP.isBoolean(123));
});

test('isArray does just that', t => {

  t.truthy(TYP.isArray([1]));
  t.truthy(TYP.isArray([]));
  t.truthy(TYP.isArray([]));

  t.falsy(TYP.isArray('123'));
  t.falsy(TYP.isArray('true'));
  t.falsy(TYP.isArray('false'));
  t.falsy(TYP.isArray({}));
  t.falsy(TYP.isArray(1.2));
  t.falsy(TYP.isArray(0.2));
  t.falsy(TYP.isArray(-12.5));
  t.falsy(TYP.isArray(123));
});

test('isNull does just that', t => {

  t.truthy(TYP.isNull(null));

  t.falsy(TYP.isNull('null'));
  t.falsy(TYP.isNull('true'));
  t.falsy(TYP.isNull('false'));
  t.falsy(TYP.isNull({}));
  t.falsy(TYP.isNull(1.2));
  t.falsy(TYP.isNull(0.2));
  t.falsy(TYP.isNull(-12.5));
  t.falsy(TYP.isNull(123));
  t.falsy(TYP.isNull());
});

test('isDate does just that', t => {

  t.truthy(TYP.isDate(new Date()));

  t.falsy(TYP.isDate('12-12-2012'));
  t.falsy(TYP.isDate('true'));
  t.falsy(TYP.isDate('false'));
  t.falsy(TYP.isDate({}));
  t.falsy(TYP.isDate(1.2));
  t.falsy(TYP.isDate(0.2));
  t.falsy(TYP.isDate(-12.5));
  t.falsy(TYP.isDate(123));
  t.falsy(TYP.isDate());
});

test('isAny is retarded and is always return true', t => {

  t.truthy(TYP.isAny(new Date()));
  t.truthy(TYP.isAny('12-12-2012'));
  t.truthy(TYP.isAny('true'));
  t.truthy(TYP.isAny('false'));
  t.truthy(TYP.isAny({}));
  t.truthy(TYP.isAny(1.2));
  t.truthy(TYP.isAny(0.2));
  t.truthy(TYP.isAny(-12.5));
  t.truthy(TYP.isAny(123));
  t.truthy(TYP.isAny());
});

test('isObject does just that', t => {

  t.truthy(TYP.isObject({}));
  t.truthy(TYP.isObject({
    herp: 1234,
  }));
  t.truthy(TYP.isObject(Object.assign({}, {
    foo: 'bar',
  })));
  t.truthy(TYP.isObject({ }));

  t.falsy(TYP.isObject(new Date()));
  t.falsy(TYP.isObject([]));
  t.falsy(TYP.isObject([]));
  t.falsy(TYP.isObject('123'));
  t.falsy(TYP.isObject('true'));
  t.falsy(TYP.isObject('false'));
  t.falsy(TYP.isObject(1.2));
  t.falsy(TYP.isObject(0.2));
  t.falsy(TYP.isObject(-12.5));
  t.falsy(TYP.isObject(123));
});

