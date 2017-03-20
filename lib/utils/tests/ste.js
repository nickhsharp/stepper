'use strict';

const ava = require('ava');
const {test, } = ava;

const HUB = require('../hub.js');
const DFD = require('../dfd.js');

const STE = require('../ste.js');

const hub = new HUB();

test('STE is a factory needs a hub, a namespace urn, and an optional default state', t => {
  t.plan(4);

  const ste = new STE(hub, 'foo:bar', 'init');

  t.is(typeof ste.on, 'function');
  t.is(typeof ste.once, 'function');
  t.is(typeof ste.set, 'function');
  t.is(typeof ste.describe, 'function');
});

test('ste just proxies on and once to hub with helper prefixery', t => {
  t.plan(3);

  const ste = new STE(hub, 'foo:bar', 'init');

  const dfd1 = new DFD();
  const dfd2 = new DFD();

  var sub = ste.on('leaving/init', (ret, meta) => {
    t.is(ret, 1234);

    dfd1.resolve();
  });

  hub.on('foo:bar:leaving/init', (ret, meta) => {
    t.is(ret, 1234);

    dfd2.resolve();
  });

  t.deepEqual(sub, {
    key: '0',
    urn: 'foo:bar:leaving/init',
  });

  ste.set('done', 1234);

  return Promise.all([dfd1.promise, dfd2.promise]);
});

test('ste set emits fun state leaving, left, entering, entered', t => {
  t.plan(4);

  const ste = new STE(new HUB(), 'foo:bar', 'init');

  const dfd1 = new DFD();
  const dfd2 = new DFD();
  const dfd3 = new DFD();
  const dfd4 = new DFD();

  ste.on('leaving/init', (ret, meta) => {
    t.is(ret, 1234);

    dfd1.resolve();
  });

  ste.on('left/init', (ret, meta) => {
    t.is(ret, 1234);

    dfd2.resolve();
  });

  ste.on('entering/done', (ret, meta) => {
    t.is(ret, 1234);

    dfd3.resolve();
  });

  ste.on('entered/done', (ret, meta) => {
    t.is(ret, 1234);

    dfd4.resolve();
  });

  ste.set('done', 1234);

  return Promise.all([dfd1.promise, dfd2.promise, dfd3.promise, dfd4.promise]);
});

test('ste has a describe thing for you the ste owner', t => {
  t.plan(4);

  const ste = new STE(new HUB(), 'foo:bar', 'init');

  let before = ste.describe();

  t.is(before.urn, 'foo:bar');
  t.is(before.state, 'init');

  ste.set('done', 1234);

  let after = ste.describe();

  t.is(after.urn, 'foo:bar');
  t.is(after.state, 'done');
});

