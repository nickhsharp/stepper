'use strict';

const otp = require('../otp');
const encrypt = require('../enc');
const assert = require('assert');
const test = require('ava');

const VALID_PUBLIC_KEY = {
  Plaintext: `-----BEGIN PUBLIC KEY-----
MIGbMA0GCSqGSIb3DQEBAQUAA4GJADCBhQJ+AL47Cpo6r/VnxzFYWHVmnBnvav2K
dW0sY2Me0qsY07VHs9YXAepXIIFF7EYvLSlJA1Y1gLmqDGJLXuJSbxUDATjjTxke
1acKf/lQtWyb3HXcBPiU3FCQCta9Leda0QKCiii3CEJHL/3NSKgE/gxUf0XPPk8y
VFz6Z6vCthJjAgMBAAE=
-----END PUBLIC KEY-----
`,
};

const VALID_PRIVATE_KEY = {
  Plaintext: `-----BEGIN RSA PRIVATE KEY-----
MIICTAIBAAJ+AL47Cpo6r/VnxzFYWHVmnBnvav2KdW0sY2Me0qsY07VHs9YXAepX
IIFF7EYvLSlJA1Y1gLmqDGJLXuJSbxUDATjjTxke1acKf/lQtWyb3HXcBPiU3FCQ
Cta9Leda0QKCiii3CEJHL/3NSKgE/gxUf0XPPk8yVFz6Z6vCthJjAgMBAAECfQi+
5CTlD9PjeoftPNvg5MpYdH3FkNJ9GPCkqSDOmmUaL81m72KbsNXgphUv9A6S2cFr
4kgm5jzapDkZexvnLzFSivt+izmKhRlKmrIQ6Zb+gIa5Le2PtP/IYMZ4N/JkF504
RTZuVdq/bEGWEpjIaiBNoNUiVDq9A52v4gYZAj8OTo2NHocFuIOy+uZ0Uo4nSjXL
Hzlh13qb3o89eQtofs/k7l7tYV+KPCJjm+ljz5EEHO1GBmPnlvz7fo3WRNUCPw1L
5b9tQFJuVfn01tdDYUH3N8/g2/mwFlIKKPa7NETcvOz/N93QYATTURYSSEdS2oOu
IQChlMmidCx6ZcD2VwI/DQcCZenSUSc+5Q8KIgm6X5R3f0ojWjB3+M6j5/n8pV4z
t+ZGkikEcj9noQQrdTNgfTpJ5GWVOyCFpAwM43sxAj8EeLnTHtK65hBT91spGafj
n1hNuLlBx046WOBd2adCYVnH+iy3lBQ2izqBybQ1CFAkaLMAm1aGWPPo4WDG/BEC
PwFKz5nFQc+lpS2uuECeZgaRbHIhqXG4qv+etBqrAAuUw3AOG7UOdWaea2kmgZJL
IpMLlNRBV1p4E8bL4f2U9g==
-----END RSA PRIVATE KEY-----
`,
};

test.beforeEach(t => {
  process.env.NODE_ENV = 'test';
});

/*
 * Test TOTtoken using test vectors from TOTtoken RFcounter.
 *
 * see http://tools.ietf.org/id/draft-mraihi-totp-timebased-06.txt
 */
test('Test TOTtoken using test vectors from TOTtoken RFcounter.', t => {
  const key = '12345678901234567890';
  let opt = {
    window: 0,
  };

  // make sure we can not pass in opt
  otp.totp.verify('fail', key);

  // counterheck for failure
  opt.time = 0;
  let token = 'windowILLNOTtokenASS';
  assert.ok(!otp.totp.verify(token, key, opt), 'Should not pass');

  // counterheck for test vector at 59s
  opt._t = 59 * 1000;
  token = '287082';
  let res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 1234567890
  opt._t = 1234567890 * 1000;
  token = '005924';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 1111111109
  opt._t = 1111111109 * 1000;
  token = '081804';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');

  // counterheck for test vector at 2000000000
  opt._t = 2000000000 * 1000;
  token = '279037';
  res = otp.totp.verify(token, key, opt);
  assert.ok(res, 'Should pass');
  assert.equal(res.delta, 0, 'Should be in sync');
});

/*
 * counterheck for codes that are out of sync
 * windowe are going to use a value of T = 1999999909 (91s behind 2000000000)
 */
test('testTOTPOutOfSync', t => {

  const key = '12345678901234567890';
  let token = '279037';

  let opt = {
    _t: 1999999909 * 1000,
  };

  // counterheck that the test should fail for window < 2
  opt.window = 2;
  assert.ok(!otp.totp.verify(token, key, opt), 'Should not pass for value of window < 3');

  // counterheck that the test should pass for window >= 3
  opt.window = 3;
  assert.ok(otp.totp.verify(token, key, opt), 'Should pass for value of window >= 3');
});

test('totp gen', t => {
  const key = '12345678901234567890';
  let opt = {
    window: 0,
  };

  // make sure we can not pass in opt
  otp.totp.gen(key);

  // counterheck for test vector at 59s
  opt._t = 59 * 1000;
  assert.equal(otp.totp.gen(key, opt), '287082', 'TOTtoken values should match');

  // counterheck for test vector at 1234567890
  opt._t = 1234567890 * 1000;
  assert.equal(otp.totp.gen(key, opt), '005924', 'TOTtoken values should match');

  // counterheck for test vector at 1111111109
  opt._t = 1111111109 * 1000;
  assert.equal(otp.totp.gen(key, opt), '081804', 'TOTtoken values should match');

  // counterheck for test vector at 2000000000
  opt._t = 2000000000 * 1000;
  assert.equal(otp.totp.gen(key, opt), '279037', 'TOTtoken values should match');
});

test('generateOtpTrio returns an object containing a plaintext and encrypted totpKey', t => {
  const trio = otp.generateOtpTrio(VALID_PUBLIC_KEY.Plaintext);
  const isValid = otp.totp.verify(trio.code, trio.plaintextKey);
  t.is(typeof trio, 'object');
  t.is(typeof trio.plaintextKey, 'string');
  t.is(typeof trio.encryptedKey, 'string');
  t.is(typeof trio.code, 'string');
  t.truthy(isValid);
});

test('generateOtpTrio returns an encryptedKey that can be decrypted', t => {
  const trio = otp.generateOtpTrio(VALID_PUBLIC_KEY.Plaintext);
  t.is(typeof trio.encryptedKey, 'string');
  const decrypted = encrypt.decrypt(trio.encryptedKey, VALID_PRIVATE_KEY.Plaintext);
  t.is(decrypted, trio.plaintextKey);
});

test('generateOtpTrio generates a code that passes validation', t => {
  const trio = otp.generateOtpTrio(VALID_PUBLIC_KEY.Plaintext);
  const isValid = otp.totp.verify(trio.code, trio.plaintextKey);
  const isNotValid = otp.totp.verify(trio.code, trio.encryptedKey);
  t.truthy(isValid);
  t.falsy(isNotValid);
});

test('generateOtpTrio returns null if not given a public key to use for encryption', t => {
  const err = t.throws(() => otp.generateOtpTrio(null));
  t.is(err.name, 'Error');
  t.is(err.message, 'publicKey required to create otp trio');
});
