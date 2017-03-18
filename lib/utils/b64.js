'use strict';

function padB64String(input) {
  let segLen = 4;
  let stringLength = input.length;
  let diff = input.length % segLen;

  if (!diff) {
    return input;
  }

  let pos = input.length;
  let padLen = (segLen - diff);
  let buffer = new Buffer(input.length + padLen);

  buffer.write(input);

  while (padLen--) {
    buffer.write('=', pos++);
  }

  return buffer.toString();
}

function encode(input, enc) {
  enc = enc || 'utf8';

  if (Buffer.isBuffer(input)) {
    return fromBase64(input.toString('base64'));
  } else {
    input = input.toString();
  }

  return fromBase64(new Buffer(input, enc).toString('base64'));
}

function decode(input, enc) {
  enc = enc || 'utf8';

  if (Buffer.isBuffer(input)) {
    return toBase64(input.toString(enc));
  } else {
    input = input.toString();
  }

  return new Buffer(toBase64(input), 'base64').toString(enc);
}

function toBase64(input) {
  return padB64String(input).replace(/\-/g, '+').replace(/_/g, '/');
}

function fromBase64(input) {
  return input.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

module.exports = {
  padB64String: padB64String,
  encode: encode,
  decode: decode,
  toBase64: toBase64,
  fromBase64: fromBase64,
};
