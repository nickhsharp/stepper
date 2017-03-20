'use strict';

const ava = require('ava');
const {test, } = ava;

const DFD = require('../dfd.js');

test('DFD is a constructor that returns a dfd object', t => {
  t.plan(5);

  const dfd = new DFD();

  t.is(typeof dfd.resolve, 'function');
  t.is(typeof dfd.reject, 'function');
  t.is(typeof dfd.promise, 'object');
  t.is(typeof dfd.promise.then, 'function');
  t.is(typeof dfd.then, 'function');
});

test('dfd.promise is a promise that is controlled by dfd.resolve', t => {
  t.plan(1);

  const dfd = new DFD();
  const data = {
    foo: 'bar',
  };

  dfd.resolve(data);

  return dfd.promise.then((ret) => {
    t.deepEqual(ret, data);
  }).catch((err) => {
  });
});

test('dfd.promise is a promise that is controlled by dfd.reject', t => {
  t.plan(1);

  const dfd = new DFD();
  const data = {
    foo: 'bar',
  };

  dfd.reject(data);

  return dfd.promise.then((ret) => {
  }).catch((err) => {
    t.deepEqual(err, data);
  });
});

test("dfd.then is for if you're to lazy to type .promise for dfd.resolve", t => {
  t.plan(1);

  const dfd = new DFD();
  const data = {
    foo: 'bar',
  };

  dfd.resolve(data);

  return dfd.then((ret) => {
    t.deepEqual(ret, data);
  }).catch((err) => {
  });
});

test("dfd.then is for if you're to lazy to type .promise for dfd.reject", t => {
  t.plan(1);

  const dfd = new DFD();
  const data = {
    foo: 'bar',
  };

  dfd.reject(data);

  return dfd.then((ret) => {
  }).catch((err) => {
    t.deepEqual(err, data);
  });
});

