'use strict';

const ava = require('ava');
const {test, } = ava;

const QUE = require('../que.js');
const DFD = require('../dfd.js');

test('QUE gets you back a que instance', t => {
  t.plan(3);

  const que = new QUE();

  t.is(typeof que.add, 'function');
  t.is(typeof que.remove, 'function');
  t.is(typeof que.get, 'function');
});

test("optionally you can pass {DEBUG:'DEBUG'} and it'll expose items", t => {
  t.plan(4);

  const que = new QUE({
    DEBUG: 'DEBUG',
  });

  t.is(typeof que.items, 'function');
  t.truthy(Array.isArray(que.items()));

  que.add('foo:bar', 1234);

  let items = que.items();

  t.is(items.length, 1);
  t.deepEqual(items[0], {
    key: '0',
    urn: 'foo:bar',
    args: 1234,
  });
});

test('you can add shit to the que and remove it... all by urn and key', t => {
  t.plan(3);

  const que = new QUE({
    DEBUG: 'DEBUG',
  });

  t.is(que.items().length, 0);

  var added = que.add('foo:bar', 1234);

  t.is(que.items().length, 1);

  que.remove(added.urn, added.key);

  t.is(que.items().length, 0);
});

test('the magic is in the urn binding to get shit out of the queue', t => {
  t.plan(22);

  const que = new QUE({
    DEBUG: 'DEBUG',
  });
  var pros = [];

  que.add('foo:bar:bing:baz', 1);
  que.add('foo:bar:bing/1234:baz', 2);
  que.add('foo:bar:bing:baz', 3);
  que.add('foo:BAR:bing:baz', 4);
  que.add('foo:bar:baz', 5);

  t.is(que.items().length, 5);

  let dfd1 = new DFD();
  pros.push(dfd1.promise);
  que.get('foo:bar:bing:baz', (ret, meta) => {
    t.is(ret, 1);
    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.getUrn, 'foo:bar:bing:baz');
    t.is(meta.matches[0], 'foo:bar:bing:baz');

    dfd1.resolve();
  });

  let dfd2 = new DFD();
  pros.push(dfd2.promise);
  que.get('foo:bar:bing:baz', (ret, meta) => {
    t.is(ret, 3);
    t.is(meta.urn, 'foo:bar:bing:baz');
    t.is(meta.getUrn, 'foo:bar:bing:baz');
    t.is(meta.matches[0], 'foo:bar:bing:baz');

    dfd2.resolve();
  });

  let dfd3 = new DFD();
  pros.push(dfd3.promise);
  que.get('foo:bar:bing/?:baz', (ret, meta) => {
    t.is(ret, 2);
    t.is(meta.urn, 'foo:bar:bing/1234:baz');
    t.is(meta.getUrn, 'foo:bar:bing/?:baz');
    t.is(meta.matches[0], '1234');

    dfd3.resolve();
  });

  let dfd4 = new DFD();
  pros.push(dfd4.promise);
  que.get('foo:*:bing/?:baz', (ret, meta) => {
    t.is(ret, 4);
    t.is(meta.urn, 'foo:BAR:bing:baz');
    t.is(meta.getUrn, 'foo:*:bing/?:baz');
    t.is(meta.matches[0], 'BAR');
    t.is(meta.matches[1], undefined);

    dfd4.resolve();
  });

  let dfd5 = new DFD();
  pros.push(dfd5.promise);
  que.get('foo:#', (ret, meta) => {
    t.is(ret, 5);
    t.is(meta.urn, 'foo:bar:baz');
    t.is(meta.getUrn, 'foo:#');
    t.is(meta.matches[0], 'bar:baz');

    dfd5.resolve();
  });

  return Promise.all(pros);
});
