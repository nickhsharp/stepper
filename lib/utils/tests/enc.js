'use strict';

/* globals VALID_PRIVATE_KEY, VALID_PUBLIC_KEY */

const encrypt = require('../enc');
const test = require('ava');
const sinon = require('sinon');
const fs = require('fs');

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

  t.context.sandbox = sinon.sandbox.create();
  t.context.toDecrypt = encrypt.encrypt('test', t.context.publicKey);
  t.context.differentKeyToDecrypt = encrypt.encrypt('test', t.context.invalidPublicKey);
});

test.afterEach(t => {
  t.context.sandbox.restore();
});

test('encrypt returns the result of encrypting a given value using a public key', t => {
  const result = encrypt.encrypt('test', t.context.publicKey);
  t.is(typeof result, 'string');
  t.not(result, t.context.publicKey);
});

test('encrypt returns null if not given a key', t => {
  const result = encrypt.encrypt('test', null);
  t.is(result, null);
});

test('encrypt returns null if not given a value to encrypt', t => {
  const result = encrypt.encrypt(null, t.context.publicKey);
  t.is(result, null);
});

test('encrypt returns null if not given a value to encrypt or a key', t => {
  const result = encrypt.encrypt(null, null);
  t.is(result, null);
});

test('encrypt returns an error if given an invalid key', t => {
  const err = t.throws(() => encrypt.encrypt('test', 'test'));
  t.is(err.name, 'Error');
  t.is(err.message, 'error:0906D06C:PEM routines:PEM_read_bio:no start line');
});


test('decrypt returns the decrypted value of a given string and correct private key', t => {
  const decrypted = encrypt.decrypt(t.context.toDecrypt, t.context.privateKey);
  t.is(decrypted, 'test');
});

test('decrypt returns null if not given a private key', t => {
  const decrypted = encrypt.decrypt(t.context.toDecrypt, null);
  t.is(decrypted, null);
});

test('decrypt returns null if not given a value to decrypt', t => {
  const decrypted = encrypt.decrypt(null, t.context.privateKey);
  t.is(decrypted, null);
});

test('decrypt returns null if not given a value to decrypt or a key', t => {
  const decrypted = encrypt.decrypt(null, null);
  t.is(decrypted, null);
});

test('decrypt fails to decrypt if given a non matching key', t => {
  const err = t.throws(() => encrypt.decrypt(t.context.differentKeyToDecrypt, t.context.privateKey));
  t.is(err.name, 'Error');
  t.is(err.message, 'error:040A1079:rsa routines:RSA_padding_check_PKCS1_OAEP_mgf1:oaep decoding error');
});
