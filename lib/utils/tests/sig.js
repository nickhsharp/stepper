'use strict';

const ava = require('ava');
const {test, } = ava;
const fs = require('fs');

const SIG = require('../sig.js');


test.beforeEach(t => {
  t.context.payload = {
    herp: 'derp',
    foo: 1234,
    bing: true,
    bong: [0],
  };
  t.context.payloadString = JSON.stringify(t.context.payload);

  t.context.secret = 'insecure';

  t.context.privateKey = fs.readFileSync(`${__dirname}/keys/test_rsa`, {
    encoding: 'utf8',
  });

  t.context.publicKey = fs.readFileSync(`${__dirname}/keys/test_rsa.pub`, {
    encoding: 'utf8',
  });

  t.context.invalidPublicKey = fs.readFileSync(`${__dirname}/keys/invalid_rsa.pub`, {
    encoding: 'utf8',
  });
});

test('SIG exposes 6 function, sign and verify', t => {
  t.plan(7);

  t.is(typeof SIG, 'object');
  t.is(typeof SIG.sign, 'function');
  t.is(typeof SIG.verify, 'function');
  t.is(typeof SIG.hmacSign, 'function');
  t.is(typeof SIG.hmacVerify, 'function');
  t.is(typeof SIG.rsaSign, 'function');
  t.is(typeof SIG.rsaVerify, 'function');
});

test('SIG can sign and verify just HS256 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.secret, 'HS256');
  var good = SIG.verify(t.context.payloadString, sig, t.context.secret, 'HS256');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.secret, 'HS256');

  t.truthy(good);
  t.falsy(bad);
});

test('SIG can sign and verify just HS384 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.secret, 'HS384');
  var good = SIG.verify(t.context.payloadString, sig, t.context.secret, 'HS384');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.secret, 'HS384');

  t.truthy(good);
  t.falsy(bad);
});

test('SIG can sign and verify just HS512 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.secret, 'HS512');
  var good = SIG.verify(t.context.payloadString, sig, t.context.secret, 'HS512');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.secret, 'HS512');

  t.truthy(good);
  t.falsy(bad);
});

test('SIG can sign and verify just RS256 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.privateKey, 'RS256');
  var good = SIG.verify(t.context.payloadString, sig, t.context.publicKey, 'RS256');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.publicKey, 'RS256');

  t.truthy(good);
  t.falsy(bad);
});

test('SIG can sign and verify just RS384 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.privateKey, 'RS384');
  var good = SIG.verify(t.context.payloadString, sig, t.context.publicKey, 'RS384');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.publicKey, 'RS384');

  t.truthy(good);
  t.falsy(bad);
});

test('SIG can sign and verify just RS512 garbage', t => {
  t.plan(2);

  var sig = SIG.sign(t.context.payloadString, t.context.privateKey, 'RS512');
  var good = SIG.verify(t.context.payloadString, sig, t.context.publicKey, 'RS512');
  var bad = SIG.verify(t.context.payloadString, sig + 'changed', t.context.publicKey, 'RS512');

  t.truthy(good);
  t.falsy(bad);
});


