'use strict';

const ava = require('ava');
const {test, } = ava;

const B64 = require('../b64.js');

const testStr = 'this is a string';
const testBuff = new Buffer(testStr, 'utf8');
const testB64Str = testBuff.toString('base64');

const encodedStr = 'dGhpcyBpcyBhIHN0cmluZw';
const encodedBuff = new Buffer(encodedStr, 'base64');

const b64PlainEncodedStr = 'dGhpcyBpcyBhIHN0cmluZw==';
const b64PlainEncodedBuffer = new Buffer(b64PlainEncodedStr, 'base64');

test('encode takes a string or a buffer and returns base64url encoded', t => {
  t.plan(2);

  t.is(B64.encode(testStr), encodedStr);
  t.is(B64.encode(testBuff), encodedStr);
});

test('decode takes a base64url encoded string or buffer and returns encoding string', t => {
  t.plan(2);

  t.is(B64.decode(encodedStr), testStr);
  t.is(B64.decode(encodedBuff), testStr);
});

test('fromBase64 takes a raw b64 and then returns base64url', t => {
  t.plan(1);

  t.is(B64.fromBase64(testB64Str), encodedStr);
});

test('toBase64 takes a b64url and then returns b64 raw', t => {
  t.plan(1);

  t.is(B64.toBase64(testB64Str), b64PlainEncodedStr);
});

test('padB64String does some padding shits', t => {
  t.plan(1);

  t.is(B64.padB64String(encodedStr), b64PlainEncodedStr);
});
