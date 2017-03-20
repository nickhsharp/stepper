'use strict';

const ava = require('ava');
const {test, } = ava;

const URN = require('../urn.js');

const urns = {
  'foo:bar:bing:baz': {
    regex: /^foo(?:\/|:)bar(?:\/|:)bing(?:\/|:)baz$/i,
    regexString: '^foo(?:\/|:)bar(?:\/|:)bing(?:\/|:)baz$',
    matching: [
      'foo:bar:bing:baz',
      'foo/bar/bing/baz',
    ],
    notMatching: [
      'foo:bar:bing:bong',
      'foo/bar/bing/bong',
    ],
  },

  'foo:bar:*:baz': {
    regex: /^foo(?:\/|:)bar(?:\/|:)([^/:]+?)(?:\/|:)baz$/i,
    regexString: '^foo(?:\/|:)bar(?:\/|:)([^/:]+?)(?:\/|:)baz$',
    matching: [
      'foo:bar:bing:baz',
      'foo:bar:bong:baz',
      'foo:bar:1234:baz',
      'foo/bar/bing/baz',
      'foo/bar/bong/baz',
      'foo/bar/1234/baz',
    ],
    notMatching: [
      'foo:bar:bing:bong',
      'foo:derp:bing:baz',
      'foo/bar/bing/bong',
      'foo/derp/bing/baz',
    ],
  },

  'foo:#:baz': {
    regex: /^foo(?:\/|:)(.+?)(?:\/|:)baz$/i,
    regexString: '^foo(?:\/|:)(.+?)(?:\/|:)baz$',
    matching: [
      'foo:bar:bing:baz',
      'foo:bar:bong:baz',
      'foo:bar:1234:baz',
      'foo:derp:1234:baz',
      'foo/bar/bing/baz',
      'foo/bar/bong/baz',
      'foo/bar/1234/baz',
      'foo/derp/1234/baz',
    ],
    notMatching: [
      'foo:bar:bing:bong',
      'foo/bar/bing/bong',
    ],
  },

  '#:bing:*': {
    regex: /^(.+?)(?:\/|:)bing(?:\/|:)([^/:]+?)$/i,
    regexString: '^(.+?)(?:\/|:)bing(?:\/|:)([^/:]+?)$',
    matching: [
      'foo:bar:bing:baz',
      'foo:bing:baz',
      'foo:bar:1234:bing:baz',
      'foo/bar/bing/baz',
      'foo/bing/baz',
      'foo/bar/1234/bing/baz',
    ],
    notMatching: [
      'foo:derp:1234:bing:one:two',
      'foo/derp/1234/bing/one/two',
    ],
  },

  'foo:bar:bing/?:baz': {
    regex: /^foo(?:\/|:)bar(?:\/|:)bing(?:\/([^:]+?))?(?:\/|:)baz$/i,
    regexString: '^foo(?:\/|:)bar(?:\/|:)bing(?:\/([^:]+?))?(?:\/|:)baz$',
    matching: [
      'foo:bar:bing:baz',
      'foo:bar:bing/ber:baz',
      'foo:bar:bing/1234:baz',
      'foo/bar/bing/baz',
      'foo/bar/bing/ber/baz',
      'foo/bar/bing/1234/baz',
    ],
    notMatching: [
      'foo:bar:bing:bong',
      'foo/bar/bing/bong',
      'foo:bar:bong',
      'foo:bar:bingbing:baz',
    ],
  },
};


test('URNS can be turned into matching regexes', t => {
  for (var key in urns) {

    let parsed = URN.createRegex(key);
    t.deepEqual(parsed, urns[key].regex);
  }
});

test('regexed URNS can then be used to match stuffs', t => {
  for (var key in urns) {

    let parsed = URN.createRegex(key);
    urns[key].matching.forEach(function(item) {
      let matches = parsed.exec(item);

      t.truthy(matches, item);
    });

    urns[key].notMatching.forEach(function(item) {
      let matches = parsed.exec(item);

      t.falsy(matches, item);
    });
  }
});

test('matches are returned so you can see what you got, *', t => {
  t.plan(1);

  let parsed = URN.createRegex('foo:bar:*');
  let matches = parsed.exec('foo:bar:bing');

  t.is(matches[1], 'bing');
});

test('matches are returned so you can see what you got, #', t => {
  t.plan(1);

  let parsed = URN.createRegex('foo:#');
  let matches = parsed.exec('foo:bar:bing');

  t.is(matches[1], 'bar:bing');
});

test('matches are returned so you can see what you got, ?', t => {
  t.plan(1);

  let parsed = URN.createRegex('foo:bar:bing/?');
  let matches = parsed.exec('foo:bar:bing/123');

  t.is(matches[1], '123');
});

test('URNS can be turned into matching regex strings', t => {
  for (var key in urns) {
    let parsed = URN.createRegexString(key);
    t.deepEqual(parsed, urns[key].regexString);
  }
});

test('creted string Regexes can then be used to construct a regex to match expected patterns', t => {
  for (var key in urns) {

    let regexString = URN.createRegexString(key);
    let parsed = new RegExp(regexString, 'i');
    urns[key].matching.forEach(function(item) {
      let matches = parsed.exec(item);

      t.truthy(matches, item);
    });

    urns[key].notMatching.forEach(function(item) {
      let matches = parsed.exec(item);

      t.falsy(matches, item);
    });
  }
});

test('creted string Regexes match created regexes with the i flag', t => {
  for (var key in urns) {

    let regexString = URN.createRegexString(key);
    let parsed = new RegExp(regexString, 'i');
    t.is(parsed.toString(), urns[key].regex.toString());
  }
});
