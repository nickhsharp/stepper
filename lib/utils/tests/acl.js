'use strict';

const test = require('ava');
const ACL = require('../acl');
const OTP = require('../otp');
const ENC = require('../enc');
const sinon = require('sinon');
const JWT = require('../jwt');
const fs = require('fs');

const MAX_AWS_HEADER_NAME_CHARACTERS = 2048;
const MAX_AWS_HEADER_NAMVE_VALUE_COMBINATION_CHARACTERS = 10240;

const CREATE_USER_PROFILE_PERMISSION = {
  wrn_pattern: '/wrn:moirai:tekmor:user:CreateUserProfile/',
  text: 'wrn:moirai:tekmor:user:CreateUserProfile',
  constraints: {},
  conditionals: {},
  allow: true,
};

const DELETE_USER_PERMISSION = {
  wrn_pattern: '/wrn:moirai:tekmor:user:DeleteUser/',
  text: 'wrn:moirai:tekmor:user:DeleteUser',
  constraints: {},
  conditionals: {},
  allow: false,
};

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

  t.context.sandbox = sinon.sandbox.create({
    useFakeTimers: true,
  });

  t.context.jwtManager = new JWT();
  t.context.user = {
    id: 4,
    name: 'Tyler Main',
    okta_id: null,
    google_id: '108684935084474245209',
    groups: [1],
    roles: null,
    meta: {
      name: 'Tyler Main',
      google_id: '108684935084474245209',
    },
    permissions: [
      {
        id: 1,
        wrn_pattern: '/wrn/moirai/tekmor/test/',
        wrn_text: 'wrn/moirai/tekmor/test',
        allow: true,
        constraints: null,
        conditionals: null,
      },
    ],
    created: 'Tue Dec 13 2016 21: 14: 57 GMT - 0800(PST)',
    type: null,
    allow: [
      {
        id: 1,
        wrn_pattern: '/wrn/moirai/tekmor/test/',
        wrn_text: 'wrn/moirai/tekmor/test',
        allow: true,
        constraints: null,
        conditionals: null,
      },
    ],
    deny: [
      {
        id: 1,
        wrn_pattern: '/wrn/moirai/tekmor/not/',
        wrn_text: 'wrn/moirai/tekmor/not',
        allow: false,
        constraints: null,
        conditionals: null,
      },
    ],
  };

  t.context.groups = [
    {
      name: 'snap-transcribe',
      id: 4,
      allow: [
        {
          wrn_pattern: '/wrn:apple:snap:gimme/transcribe/',
          text: 'wrn:apple:snap:gimme/transcribe',
          constraints: {},
          conditionals: {},
          allow: true,
        },
      ],
      deny: [],
    },
    {
      name: 'snap-format',
      id: 5,
      allow: [
        {
          wrn_pattern: '/wrn:apple:snap:gimme/',
          text: 'wrn:apple:snap:gimme',
          constraints: {},
          conditionals: {},
          allow: true,
        },
      ],
      deny: [
        {
          wrn_pattern: '/wrn:apple:snap:gimme/transcribe/',
          text: 'wrn:apple:snap:gimme/transcribe',
          constraints: {},
          conditionals: {},
          allow: false,
        },
      ],
    },
  ];

  t.context.roles = [
    {
      name: 'relay-dev',
      id: 1,
      allow: [
        {
          wrn_pattern: '/wrn:park:relay:*/',
          text: 'wrn:park:relay:*',
          constraints: {},
          conditionals: {},
          allow: true,
        },
      ],
      deny: [],
    },
  ];

  t.context.expectedSlimJwt = {
    groups: [4, 5],
    roles: [1],
    principal: 89,
    allow: ['/wrn/moirai/tekmor/test/'],
    deny: ['/wrn/moirai/tekmor/not/'],
    secret: {
      totpKey: '594935',
    },
  };

  t.context.expectedFullJwt = {
    groups: [
      {
        name: 'snap-transcribe',
        id: 4,
        allow: [
          {
            wrn_pattern: '/wrn:apple:snap:gimme/transcribe/',
            text: 'wrn:apple:snap:gimme/transcribe',
            constraints: {},
            conditionals: {},
            allow: true,
          },
        ],
        deny: [],
      },
      {
        name: 'snap-format',
        id: 5,
        allow: [
          {
            wrn_pattern: '/wrn:apple:snap:gimme/',
            text: 'wrn:apple:snap:gimme',
            constraints: {},
            conditionals: {},
            allow: true,
          },
        ],
        deny: [
          {
            wrn_pattern: '/wrn:apple:snap:gimme/transcribe/',
            text: 'wrn:apple:snap:gimme/transcribe',
            constraints: {},
            conditionals: {},
            allow: false,
          },
        ],
      },
    ],
    roles: [
      {
        name: 'relay-dev',
        id: 1,
        allow: [
          {
            wrn_pattern: '/wrn:park:relay:*/',
            text: 'wrn:park:relay:*',
            constraints: {},
            conditionals: {},
            allow: true,
          },
        ],
        deny: [],
      },
    ],
    allow: [CREATE_USER_PROFILE_PERMISSION],
    deny: [DELETE_USER_PERMISSION],
    principal: 89,
    secret: {
      totpKey: '594935',
    },
  };
  t.context.encryptedTotpKey = 'IAmASuperEncryptedTotpKeySAWEEEEEET';
});

test('acl creates a slim jwt payload when given a user object', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);
  const actual = acl.createSlimJwtPayload(t.context.user, t.context.encryptedTotpKey);

  t.deepEqual(actual.groups, t.context.user.groups);
  t.deepEqual(actual.roles, t.context.user.roles);
  t.deepEqual(actual.principal, t.context.user.id);
  t.deepEqual(actual.allow, t.context.expectedSlimJwt.allow);
  t.deepEqual(actual.deny, t.context.expectedSlimJwt.deny);
  t.is(actual.username, t.context.user.name);
  t.true(typeof actual.secret === 'object');
  t.is(actual.secret.totpKey, t.context.encryptedTotpKey);
});

test('acl creates a slim jwt payload when given a user object and filters out duplicate patterns', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);
  const user = {
    id: 4,
    name: 'Tyler Main',
    okta_id: null,
    google_id: '108684935084474245209',
    groups: [1],
    roles: null,
    permissions: [
      {
        wrn_pattern: '/wrn/moirai/tekmor/thing/',
      },
    ],
    json: {
      name: 'Tyler Main',
      google_id: '108684935084474245209',
    },
    created: 'Tue Dec 13 2016 21: 14: 57 GMT - 0800(PST)',
    type: null,
    allow: [
      {
        wrn_pattern: '/wrn/moirai/tekmor/test/',
      },
      {
        wrn_pattern: '/wrn/moirai/tekmor/test/',
      },
      {
        wrn_pattern: '/wrn/moirai/tekmor/test/',
      },
      {
        wrn_pattern: '/wrn/moirai/tekmor/other/',
      },
    ],
    deny: [
      {
        wrn_pattern: '/wrn/moirai/tekmor/not/',
      },
      {
        wrn_pattern: '/wrn/moirai/tekmor/not/',
      },
      {
        wrn_pattern: '/wrn/moirai/tekmor/not/it',
      },
    ],
  };
  const actual = acl.createSlimJwtPayload(user, t.context.encryptedTotpKey);

  t.deepEqual(actual.allow, ['/wrn/moirai/tekmor/test/', '/wrn/moirai/tekmor/other/']);
  t.deepEqual(actual.deny, ['/wrn/moirai/tekmor/not/', '/wrn/moirai/tekmor/not/it']);
});

test('acl creates a full jwt payload when given a user, group and role permission object', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);
  const actual = acl.createFullJwtPayload(t.context.user, t.context.roles, t.context.groups, t.context.encryptedTotpKey);

  t.deepEqual(actual.groups, t.context.expectedFullJwt.groups);
  t.deepEqual(actual.roles, []);
  t.deepEqual(actual.principal, t.context.user.id);
  t.deepEqual(actual.allow, t.context.user.allow);
  t.deepEqual(actual.deny, t.context.user.deny);
  t.is(actual.username, t.context.user.name);
  t.true(typeof actual.secret === 'object');
  t.is(actual.secret.totpKey, t.context.encryptedTotpKey);
});

test('acl finalizePayload returns a slim jwt, full jwt and otp secret', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);
  const actual = acl.finalizePayload(t.context.user, t.context.roles, t.context.groups);
  const fullFinalHeaderValues = `x-pantheon-auth${actual.slim}`;

  t.true(actual.slim.length < MAX_AWS_HEADER_NAME_CHARACTERS, 'slim jwt is below the maximum header VALUE threshold');
  t.true(fullFinalHeaderValues.length < MAX_AWS_HEADER_NAMVE_VALUE_COMBINATION_CHARACTERS, 'slim jwt and header name combined are below the maximum header name/value combined threshold');
  t.is(actual.slim.split('.').length, 3, 'created jwt has headers, payload and signature');
  t.is(actual.full.split('.').length, 3, 'created jwt has headers, payload and signature');
  t.truthy(actual.otp, '594935');
});

test('acl finalizePayload throws an error if not given a private and public key during creation', t => {
  const acl = new ACL();
  const error = t.throws(() => acl.finalizePayload(t.context.user, t.context.roles, t.context.groups));

  t.is(error.message, 'Missing keys for jwt creation');
});

test('acl finalizePayload properly formats a slim and full jwt based on received user, roles and groups', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);

  const groups = [
    {
      id: 1,
      name: 'snap-test',
      permissions: [1],
      meta: {
        name: 'snap-transcribe',
      },
    },
  ];

  const actual = acl.finalizePayload(t.context.user, t.context.roles, groups);
  const decodedSlim = t.context.jwtManager.decode(actual.slim);
  const decodedFull = t.context.jwtManager.decode(actual.full);

  t.deepEqual(decodedSlim.header.alg, 'RS256');
  t.deepEqual(decodedSlim.payload.groups, t.context.user.groups);
  t.deepEqual(decodedSlim.payload.roles, t.context.user.roles);
  t.deepEqual(decodedSlim.payload.allow[0], t.context.user.allow[0].wrn_pattern);
  t.deepEqual(decodedSlim.payload.deny[0], t.context.user.deny[0].wrn_pattern);
  t.deepEqual(decodedSlim.payload.principal, t.context.user.id);
  t.truthy(decodedSlim.payload.secret);
  t.falsy(decodedSlim.payload.permissions);
  t.true(typeof decodedSlim.payload.secret.totpKey === 'string');



  t.deepEqual(decodedFull.header.alg, 'RS256');
  t.deepEqual(decodedFull.payload.groups, groups);
  t.deepEqual(decodedFull.payload.roles, []);
  t.deepEqual(decodedFull.payload.allow[0], t.context.user.allow[0]);
  t.deepEqual(decodedFull.payload.deny[0], t.context.user.deny[0]);
  t.deepEqual(decodedFull.payload.principal, t.context.user.id);
  t.truthy(decodedFull.payload.secret);
  t.truthy(decodedFull.payload.permissions);
  t.true(typeof decodedFull.payload.secret.totpKey === 'string');
});

test('Full and slim jwt get the same decrypted otp key', t => {
  const acl = new ACL(t.context.privateKey, t.context.publicKey);

  const groups = [
    {
      id: 1,
      name: 'snap-test',
      permissions: [1],
      meta: {
        name: 'snap-transcribe',
      },
    },
  ];

  const actual = acl.finalizePayload(t.context.user, t.context.roles, groups);
  const decodedSlim = t.context.jwtManager.decode(actual.slim);
  const decodedFull = t.context.jwtManager.decode(actual.full);

  t.is(decodedSlim.payload.secret.totpKey, decodedFull.payload.secret.totpKey, 'Full and slim jwt get the same decrypted otp key');
});

function assertValidOtpCode(code, encryptedKey, t) {
  const decodedTotpKey = ENC.decrypt(encryptedKey, t.context.privateKey);
  const isValid = OTP.totp.verify(code, decodedTotpKey);
  t.truthy(isValid);
}

/*

  Full permission object
    {
      '/test:the:thing/': {
          text: 'test:the:thing',
          constraints: {},
          conditionals: {}
      }
    }

    Permission database to store permissions with the columns:
    wrn_pattern to store the wrn_pattern of the permission path.
    text to store the string version of the path.
    constraints to store the constraints of the path.
    conditionals to store the conditionals of the path.


    Users roles and groups will be associated with permissions records from the permissions db. This will
    allow much easier determinations of who is able to perform which actions.

    Users allow and deny properties will contain the wrn_pattern form of the permissions that they have.
 */
