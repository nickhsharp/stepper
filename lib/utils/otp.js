'use strict';

/**
 * This coid is largely yoinked from https://github.com/guyht/notp.
 */
const crypto = require('crypto');
const encrypt = require('./enc');

/**
 * The character length that is used when generating an otp key.
 *
 * @type {Number}
 */
const KEY_LENGTH = 16;

let hotp = {};

/**
 * Generate a counter based One Time Password
 *
 * @return {String} the one time password
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as this is the seed that is used to calculate the HMAC
 *
 *     counter - Counter value.  This should be stored by the application, must
 *         be user specific, and be incremented for each request.
 *
 */
hotp.gen = function(key, opt) {
  key = key || '';
  opt = opt || {};
  let counter = opt.counter || 0;

  let p = 6;

  // Create the byte array
  let b = new Buffer(intToBytes(counter));

  let hmac = crypto.createHmac('sha1', new Buffer(key));

  // Update the HMAC with the byte array
  let digest = hmac.update(b).digest('hex');

  // Get byte array
  let h = hexToBytes(digest);

  // Truncate
  let offset = h[19] & 0xf;
  let v = (h[offset] & 0x7f) << 24 |
    (h[offset + 1] & 0xff) << 16 |
    (h[offset + 2] & 0xff) << 8 |
    (h[offset + 3] & 0xff);

  v = v + '';

  return v.substr(v.length - p, p);
};

/**
 * Check a One Time Password based on a counter.
 *
 * @return {Object} null if failure, { delta: # } on success
 * delta is the time step difference between the client and the server
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     token - Passcode to validate.
 *
 *     window - The allowable margin for the counter.  The function will check
 *         'W' codes in the future against the provided passcode.  Note,
 *         it is the calling applications responsibility to keep track of
 *         'W' and increment it for each password check, and also to adjust
 *         it accordingly in the case where the client and server become
 *         out of sync (second argument returns non zero).
 *         E.g. if W = 100, and C = 5, this function will check the passcode
 *         against all One Time Passcodes between 5 and 105.
 *
 *         Default - 50
 *
 *     counter - Counter value.  This should be stored by the application, must
 *         be user specific, and be incremented for each request.
 *
 */
hotp.verify = function(token, key, opt) {
  opt = opt || {};
  let window = opt.window || 50;
  let counter = opt.counter || 0;

  // Now loop through from C to C + W to determine if there is
  // a correct code
  for (let i = counter - window; i <= counter + window; ++i) {
    opt.counter = i;
    if (this.gen(key, opt) === token) {
      // We have found a matching code, trigger callback
      // and pass offset
      return {
        delta: i - counter,
      };
    }
  }

  // If we get to here then no codes have matched, return null
  return null;
};

let totp = {};

/**
 * Generate a time based One Time Password
 *
 * @return {String} the one time password
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     time - The time step of the counter.  This must be the same for
 *         every request and is used to calculat C.
 *
 *         Default - 30
 *
 */
totp.gen = function(key, opt) {
  opt = opt || {};
  let time = opt.time || 30;
  let _t = Date.now();

  // Time has been overwritten.
  if (opt._t) {
    if (process.env.NODE_ENV != 'test') {
      throw new Error('cannot overwrite time in non-test environment!');
    }

    _t = opt._t;
  }

  // Determine the value of the counter, C
  // This is the number of time steps in seconds since T0
  opt.counter = Math.floor((_t / 1000) / time);

  return hotp.gen(key, opt);
};

/**
 * Check a One Time Password based on a timer.
 *
 * @return {Object} null if failure, { delta: # } on success
 * delta is the time step difference between the client and the server
 *
 * Arguments:
 *
 *  args
 *     key - Key for the one time password.  This should be unique and secret for
 *         every user as it is the seed used to calculate the HMAC
 *
 *     token - Passcode to validate.
 *
 *     window - The allowable margin for the counter.  The function will check
 *         'W' codes either side of the provided counter.  Note,
 *         it is the calling applications responsibility to keep track of
 *         'W' and increment it for each password check, and also to adjust
 *         it accordingly in the case where the client and server become
 *         out of sync (second argument returns non zero).
 *         E.g. if W = 5, and C = 1000, this function will check the passcode
 *         against all One Time Passcodes between 995 and 1005.
 *
 *         Default - 6
 *
 *     time - The time step of the counter.  This must be the same for
 *         every request and is used to calculate C.
 *
 *         Default - 30
 *
 */
totp.verify = function(token, key, opt) {
  opt = opt || {};
  let time = opt.time || 30;
  let _t = Date.now();

  // Time has been overwritten.
  if (opt._t) {
    if (process.env.NODE_ENV != 'test') {
      throw new Error('cannot overwrite time in non-test environment!');
    }

    _t = opt._t;
  }

  // Determine the value of the counter, C
  // This is the number of time steps in seconds since T0
  opt.counter = Math.floor((_t / 1000) / time);

  return hotp.verify(token, key, opt);
};

/**
 * convert an integer to a byte array
 * @param {Integer} num
 * @return {Array} bytes
 */
const intToBytes = function(num) {
  let bytes = [];

  for (let i = 7; i >= 0; --i) {
    bytes[i] = num & (255);
    num = num >> 8;
  }

  return bytes;
};


/**
 * convert a hex value to a byte array
 * @param {String} hex string of hex to convert to a byte array
 * @return {Array} bytes
 */
const hexToBytes = function(hex) {
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }

  return bytes;
};

/**
 * Returns the plaintext key and encrypted key for a user to send up for requests as well as a generated otp code.
 *
 * @return {Object} Object containing plaintext and encrypted key for otp tokens.
 */
function generateOtpTrio(publicKey) {
  if (!publicKey) {
    throw Error('publicKey required to create otp trio');
  }

  const plaintextKey = generateOtpKey();
  const encrypted = encrypt.encrypt(plaintextKey, publicKey);
  return {
    plaintextKey: plaintextKey,
    encryptedKey: encrypted,
    code: totp.gen(plaintextKey),
  };
}

/**
 * Generates a 16 digit alphanumeric string to be used as an otp key.
 *
 * @return {String}        A 16 character alphanumeric string
 */
function generateOtpKey() {
  return new Array(KEY_LENGTH).join().replace(/(.|$)/g, () => {
    return ((Math.random() * 36) | 0).toString(36)[Math.random() < 0.5 ? 'toString' : 'toUpperCase']();
  });
}

module.exports = {
  totp: totp,
  generateOtpTrio: generateOtpTrio,
};
