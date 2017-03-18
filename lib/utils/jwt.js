'use strict';

// Optionally allow GZIP or B64 on encode and decode.
const B64 = require('./b64.js');
const SIG = require('./sig.js');

function JWT(options) {
  options = options || {};
  var opts = Object.assign({}, options);

  opts.algorithm = opts.algorithm || 'HS256';
  opts.signKey = opts.signKey || 'insecure';
  opts.verifyKey = opts.verifyKey || 'insecure';

  opts.expiresIn = opts.expiresIn || 3600;
  opts.notBefore = opts.notBefore || 0;
  opts.issuer = opts.issuer || 'unknown';
  opts.audience = opts.audience || 'unknown';
  opts.enc = opts.enc || 'utf8';

  opts.header = {
    alg: opts.algorithm,
    typ: 'JWT',
    cty: 'JWT',
    jku: '',
    kid: '',
  };
  opts.headerString = JSON.stringify(opts.header);
  opts.headerEncoded = B64.encode(opts.headerString, 'binary');

  this.create = (payload) => {
    payload.iat = Math.floor(Date.now() / 1000);
    payload.nbf = payload.iat + opts.notBefore;
    payload.exp = payload.iat + opts.expiresIn;
    payload.iss = payload.iss || opts.issuer;
    payload.aud = payload.aud || opts.audience;
    payload.jti = `jwt:${payload.sub}/${payload.iat}`;

    let encodedPayload = B64.encode(JSON.stringify(payload), opts.enc);

    return `${opts.headerEncoded}.${encodedPayload}`;
  };

  this.sign = (unsigned) => {
    const sig = SIG.sign(unsigned, opts.signKey, opts.header.alg);

    return `${unsigned}.${sig}`;
  };

  this.verify = (decoded) => {
    var validity = SIG.verify(decoded.signed, decoded.signature, opts.verifyKey, opts.header.alg);
    var now = Math.floor(Date.now() / 1000);

    if (!validity) {
      return false;
    }

    if (decoded.payload.iat > now) {
      return false;
    }

    if (decoded.payload.nbf > now) {
      return false;
    }

    if (decoded.payload.exp < now) {
      return false;
    }

    return true;
  };

  this.decode = (jwt) => {
    const parts = jwt.split('.');
    const decoded = {
      header: JSON.parse(B64.decode(parts[0], 'binary')),
      payload: JSON.parse(B64.decode(parts[1], opts.enc)),
      signed: `${parts[0]}.${parts[1]}`,
      signature: parts[2],
    };

    return decoded;
  };

  this.createAndSign = (payload) => {
    return this.sign(this.create(payload));
  };

  this.decodeAndVerify = (payload) => {
    var decoded = this.decode(payload);
    decoded.valid = this.verify(decoded);

    return decoded;
  };

  return this;
}

module.exports = JWT;
