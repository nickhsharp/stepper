'use strict';

const B64 = require('./b64.js');
const crypto = require('crypto');

function hmacSign(payload, bits, key) {
  const hmac = crypto.createHmac(`sha${bits}`, key);
  const sig = (hmac.update(payload), hmac.digest('base64'));

  return B64.fromBase64(sig);
}

function hmacVerify(payload, signature, bits, key) {
  const sig = hmacSign(payload, bits, key);

  return sig === signature;
}

function rsaSign(payload, bits, key) {
  const rsa = crypto.createSign(`RSA-SHA${bits}`);

  rsa.update(payload);

  return B64.fromBase64(rsa.sign(key, 'base64'));
}

function rsaVerify(payload, signature, bits, key) {
  const rsa = crypto.createVerify(`RSA-SHA${bits}`);

  rsa.update(payload);

  return rsa.verify(key, B64.toBase64(signature), 'base64');
}

const signers = {
  hs: hmacSign,
  rs: rsaSign,
};

const verifiers = {
  hs: hmacVerify,
  rs: rsaVerify,
};

function sign(payload, key, algorithm) {
  const match = algorithm.match(/^(RS|HS)(256|384|512)$/i);
  var algo = (match[1] || match[3]).toLowerCase();
  var bits = match[2];

  algo = algo || 'HS';
  bits = bits || '512';

  return signers[algo](payload, bits, key);
}

function verify(payload, signature, key, algorithm) {
  const match = algorithm.match(/^(RS|HS)(256|384|512)$/i);
  var algo = (match[1] || match[3]).toLowerCase();
  var bits = match[2];

  algo = algo || 'HS';
  bits = bits || '512';

  return verifiers[algo](payload, signature, bits, key);
}

module.exports = {
  sign: sign,
  verify: verify,
  hmacSign: hmacSign,
  hmacVerify: hmacVerify,
  rsaSign: rsaSign,
  rsaVerify: rsaVerify,
};
