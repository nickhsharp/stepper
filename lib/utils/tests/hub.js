'use strict';

const ava = require('ava');
const {test, } = ava;

const HUB = require('../hub.js');
const DFD = require('../dfd.js');

test('HUB is super sexy constructor that returns you a hub', t => {
  t.plan(4);

  const hub = new HUB();

  t.is(typeof hub.on, 'function');
  t.is(typeof hub.off, 'function');
  t.is(typeof hub.once, 'function');
  t.is(typeof hub.emit, 'function');
});

test("optionally you can pass {DEBUG:'DEBUG'} and it'll expose history", t => {
  t.plan(4);

  const hub = new HUB({
    DEBUG: 'DEBUG',
  });

  t.is(typeof hub.history, 'function');
  t.truthy(Array.isArray(hub.history()));

  hub.emit('foo:bar', 1234);

  let history = hub.history();

  t.is(history.length, 1);
  t.deepEqual(history[0], {
    urn: 'foo:bar',
    args: 1234,
  });
});

test('hub once == hub on with the third param set to 1', t => {
  t.plan(8);

  const hub = new HUB();
  const data = {
    foo: 'bar',
  };

  var pros = [];

  let dfd1 = new DFD();
  pros.push(dfd1.promise);
  hub.once('foo:bar', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar');
    t.is(meta.boundUrn, 'foo:bar');
    t.is(meta.matches[0], 'foo:bar');

    dfd1.resolve();
  });

  let dfd2 = new DFD();
  pros.push(dfd2.promise);
  hub.on('foo:bar', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar');
    t.is(meta.boundUrn, 'foo:bar');
    t.is(meta.matches[0], 'foo:bar');

    dfd2.resolve();
  }, 1);

  hub.emit('foo:bar', data);
  hub.emit('foo:bar', data);

  return Promise.all(pros);
});

test('hub does wildcard urn type awesome shit', t => {
  t.plan(21);

  const hub = new HUB();
  const data = {
    foo: 'bar',
  };

  var pros = [];

  let dfd1 = new DFD();
  pros.push(dfd1.promise);
  hub.on('foo:bar:bing:baz', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.boundUrn, 'foo:bar:bing:baz');
    t.is(meta.matches[0], 'foo:bar:bing:baz');

    dfd1.resolve();
  });

  let dfd2 = new DFD();
  pros.push(dfd2.promise);
  hub.on('foo:bar:bing/?:baz', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.boundUrn, 'foo:bar:bing/?:baz');
    t.is(meta.matches[0], undefined);

    dfd2.resolve();
  });


  let dfd3 = new DFD();
  pros.push(dfd3.promise);
  hub.on('foo:bar:*:baz', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.boundUrn, 'foo:bar:*:baz');
    t.is(meta.matches[0], 'bing');

    dfd3.resolve();
  });

  let dfd4 = new DFD();
  pros.push(dfd4.promise);
  hub.on('foo:*:*:baz', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.boundUrn, 'foo:*:*:baz');
    t.is(meta.matches[0], 'bar');
    t.is(meta.matches[1], 'bing');

    dfd4.resolve();
  });

  let dfd5 = new DFD();
  pros.push(dfd5.promise);
  hub.on('foo:#:baz', (ret, meta) => {
    t.deepEqual(ret, data);

    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.boundUrn, 'foo:#:baz');
    t.is(meta.matches[0], 'bar:bing');

    dfd5.resolve();
  });

  hub.emit('foo:bar:bing:baz', data);

  return Promise.all(pros);
});

test('hub on returns a key/urn pair that lets you off it', t => {
  t.plan(2);

  const hub = new HUB();
  const data = {
    foo: 'bar',
  };

  const dfd = new DFD();

  var sub = hub.on('foo:bar', (ret, meta) => {
    t.deepEqual(ret, data);

    setTimeout(() => {
      dfd.resolve();
    }, 1);
  });

  t.deepEqual(sub, {
    key: '0',
    urn: 'foo:bar',
  });

  hub.emit('foo:bar', data);

  hub.off(sub.urn, sub.key);

  hub.emit('foo:bar', data);
  hub.emit('foo:bar', data);

  return dfd.promise;
});


test("hub catches shitty callbacks so it doesn't explode the world", t => {
  t.plan(0);

  const hub = new HUB();
  const data = {
    foo: 'bar',
  };

  const dfd = new DFD();

  var sub = hub.on('foo:bar', (ret, meta) => {
    foo = bar;
    t.truthy(true);
  });

  hub.emit('foo:bar', data);
  hub.emit('foo:bar', data);

  setTimeout(() => {
    dfd.resolve();
  }, 1);

  return dfd.promise;
});

