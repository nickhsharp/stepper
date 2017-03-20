'use strict';

const ava = require('ava');
const {test, } = ava;

const DNS = require('../dns.js')();

const dns = require('dns');

test('DNS exposes a cache/reset and the original', t => {
  t.is(typeof DNS.cache, 'function');
  t.is(typeof DNS.reset, 'function');
  t.is(typeof DNS.original, 'object');
});

test('calling cache sets a cache proxy in front of native DNS functions, reset undoes that', t => {
  t.deepEqual(DNS.original.resolve, dns.resolve);

  DNS.cache();

  t.notDeepEqual(DNS.original.resolve, dns.resolve);

  DNS.reset();

  t.deepEqual(DNS.original.resolve, dns.resolve);
});

//TODO: shit loads better tests, and a stub of sorts
test.cb('cache misses call through to original', t => {
  DNS.cache();

  dns.lookup('nodejs.org', (err, ret) => {

    console.log(err, ret);

    dns.lookup('nodejs.org', (err, ret) => {

      console.log(err, ret);
      t.end();
    });
  });
});
