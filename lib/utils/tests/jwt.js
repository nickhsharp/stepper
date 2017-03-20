'use strict';

const ava = require('ava');
const {test, } = ava;
const fs = require('fs');

const JWT = require('../jwt.js');


test.beforeEach(t => {
  t.context.privateKey = fs.readFileSync(`${__dirname}/keys/test_rsa`, {
    encoding: 'utf8',
  });

  t.context.publicKey = fs.readFileSync(`${__dirname}/keys/test_rsa.pub`, {
    encoding: 'utf8',
  });

  t.context.invalidPublicKey = fs.readFileSync(`${__dirname}/keys/invalid_rsa.pub`, {
    encoding: 'utf8',
  });

  t.context.payload = {
    herp: 'derp',
    foo: 1234,
    bing: true,
    bong: [0],
  };
});

test('JWT is a constructor that when called gives you a JWT managing instance', t => {
  t.plan(7);

  var jwtManager = new JWT();

  t.is(typeof jwtManager, 'object');
  t.is(typeof jwtManager.create, 'function');
  t.is(typeof jwtManager.sign, 'function');
  t.is(typeof jwtManager.createAndSign, 'function');
  t.is(typeof jwtManager.decode, 'function');
  t.is(typeof jwtManager.verify, 'function');
  t.is(typeof jwtManager.decodeAndVerify, 'function');
});

test('default JWT manager can create unsigned JWTs - default settings', t => {
  t.plan(6);

  var jwtManager = new JWT();
  var jwt = jwtManager.create(t.context.payload);
  var decoded = jwtManager.decode(jwt);

  t.is(decoded.payload.herp, 'derp');
  t.is(decoded.payload.foo, 1234);
  t.is(decoded.payload.bing, true);
  t.is(decoded.payload.bong[0], 0);
  t.is(decoded.payload.iat, decoded.payload.nbf);
  t.is(decoded.payload.exp - decoded.payload.iat, 3600);
});

test('unsigned JWTs can then be signed - default settings', t => {
  t.plan(1);

  var jwtManager = new JWT();
  var jwt = jwtManager.create(t.context.payload);
  var signed = jwtManager.sign(jwt);

  var parts = signed.split('.');

  t.is(parts.length, 3);
});

test('or JWTs can be created and Signed in one go - default settings', t => {
  t.plan(2);

  var jwtManager = new JWT();
  var jwt = jwtManager.create(t.context.payload);
  var signed = jwtManager.sign(jwt);
  var secondSigned = jwtManager.createAndSign(t.context.payload);

  var parts = secondSigned.split('.');

  t.is(parts.length, 3);
  t.is(signed, secondSigned);
});

test('decoded signed JWTs can be verified - default settings', t => {
  t.plan(1);

  var jwtManager = new JWT();
  var jwt = jwtManager.createAndSign(t.context.payload);

  var decoded = jwtManager.decode(jwt);
  var verified = jwtManager.verify(decoded);

  t.truthy(verified);
});

test('JWTs can be decoded and verified in one go - default settings', t => {
  t.plan(2);

  var jwtManager = new JWT();
  var jwt = jwtManager.createAndSign(t.context.payload);
  var decoded = jwtManager.decodeAndVerify(jwt);

  t.truthy(decoded.valid);
  t.truthy(decoded.payload.herp, 'derp');
});

test('dicking with the signature fails the verification - default settings', t => {
  t.plan(1);

  var jwtManager = new JWT();
  var jwt = jwtManager.createAndSign(t.context.payload);
  jwt += 'changed';

  var decoded = jwtManager.decode(jwt);
  var verified = jwtManager.verify(decoded);

  t.falsy(verified);
});

test('can use RSA public and private as well', t => {
  t.plan(2);

  var jwtManager = new JWT({
    signKey: t.context.privateKey,
    verifyKey: t.context.publicKey,
    algorithm: 'RS512',
  });

  var jwt = jwtManager.createAndSign(t.context.payload);
  var decoded = jwtManager.decodeAndVerify(jwt);

  t.truthy(decoded.valid);
  t.truthy(decoded.payload.herp, 'derp');
});

test('can control the expiration time', t => {
  const ONE_MONTH_IN_SECONDS = 2628000;

  var jwtManager = new JWT({
    expiresIn: ONE_MONTH_IN_SECONDS,
  });

  var jwt = jwtManager.createAndSign(t.context.payload);
  var decoded = jwtManager.decodeAndVerify(jwt);

  t.truthy(decoded.valid);
  t.truthy(decoded.payload.herp, 'derp');
  t.is(decoded.payload.exp - decoded.payload.iat, ONE_MONTH_IN_SECONDS);
});
