'use strict';

const ava = require('ava');
const {test, } = ava;

const DOT = require('../dot.js');

const obj = {
  herp: 'derp',
  foo: 1234,
  bing: true,
  bong: [0],
  buz: {
    ber: true,
  },
};

const objDotted = {
  herp: 'derp',
  foo: 1234,
  bing: true,
  'bong[0]': 0,
  'buz.ber': true,
};

const simpleDotted = {
  'bong[0]': 0,
};

const deeper = {
  herp: 'derp',
  foo: 1234,
  bing: true,
  bong: [0],
  buz: {
    ber: {
      bang: true,
    },
  },
  fuz: {
    fer: {
      fong: {
        ferp: 1234,
      },
    },
  },
};

const deeperDotted = {
  herp: 'derp',
  foo: 1234,
  bing: true,
  'bong[0]': 0,
  'buz.ber.bang': true,
  'fuz.fer.fong.ferp': 1234,
};

const deepArray = {
  foo: [
    {
      herp: true,
    },
    {
      derp: true,
    },
  ],
};

const deepArrayDotted = {
  'foo[0].herp': true,
  'foo[1].derp': true,
};

const nastyDeep = {
  foo: [
    {
      herp: true,
    },
    {
      derp: {
        fiz: [
          'buzz',
        ],
      },
    },
  ],
};

const nastyDeepDotted = {
  'foo[0].herp': true,
  'foo[1].derp.fiz[0]': 'buzz',
};

const partialTo = {
  foo: 'bar',
  'bing.baz': true,
  'bong[0]': {
    herp: 1234,
  },
};

const partialToDotted = {
  foo: 'bar',
  'bing.baz': true,
  'bong[0].herp': 1234,
};

const partialToNested = {
  foo: 'bar',
  'bing.baz': true,
  'bong[0]': {
    herp: {
      derpity: 1234,
    },
  },
};

const partialDotted = {
  foo: 'bar',
  'bing.baz': true,
  'bong[0]': {
    herp: 1234,
  },
  buz: {
    ber: [
      1234,
      3456,
    ],
  },
};

const fromPartialDotted = {
  foo: 'bar',
  bing: {
    baz: true,
  },
  bong: [
    {
      herp: 1234,
    },
  ],
  buz: {
    ber: [
      1234,
      3456,
    ],
  },
};

const partialDeepDotted = {
  foo: 'bar',
  'bing.baz': {
    bong: {
      ber: {
        'herpity.derptity.doo': false,
      },
    },
  },
  'bing.baz.bong.ber.silly': true,
  'bong[0]': {
    herp: 1234,
  },
  buz: {
    ber: [
      1234,
      3456,
    ],
  },
};

const fromPartialDeepDotted = {
  foo: 'bar',
  bing: {
    baz: {
      bong: {
        ber: {
          herpity: {
            derptity: {
              doo: false,
            },
          },
          silly: true,
        },
      },
    },
  },
  bong: [
    {
      herp: 1234,
    },
  ],
  buz: {
    ber: [
      1234,
      3456,
    ],
  },
};

const partialToNestedDotted = {
  foo: 'bar',
  'bing.baz': true,
  'bong[0].herp.derpity': 1234,
};

test('can convert an object to dot notation', t => {
  t.plan(1);

  var dotted = DOT.to(obj);

  t.deepEqual(dotted, objDotted);
});

test('can convert a deeper object to dot notation', t => {
  t.plan(1);

  var dotted = DOT.to(deeper);

  t.deepEqual(dotted, deeperDotted);
});

test('can convert a deep object nested in an array to dot notation', t => {
  t.plan(1);

  var dotted = DOT.to(deepArray);

  t.deepEqual(dotted, deepArrayDotted);
});

test('can convert a nasty deep object to dot notation', t => {
  t.plan(1);

  var dotted = DOT.to(nastyDeep);

  t.deepEqual(dotted, nastyDeepDotted);
});

test('can convert an dotted object to normal', t => {
  t.plan(1);

  var normal = DOT.from(objDotted);
  t.deepEqual(normal, obj);
});

test('can convert an deeper dotted object to normal', t => {
  t.plan(1);

  var normal = DOT.from(deeperDotted);

  t.deepEqual(normal, deeper);
});

test('can convert an deeper array dotted object to normal', t => {
  t.plan(1);

  var normal = DOT.from(deepArrayDotted);

  t.deepEqual(normal, deepArray);
});

test('can convert an nasty deeper dotted object to normal', t => {
  t.plan(1);

  var normal = DOT.from(nastyDeepDotted);

  t.deepEqual(normal, nastyDeep);
});

test('is safe for repeated toDot... like toDot then toDot ad naseum', t => {
  t.plan(4);

  var reDotted = DOT.to(objDotted);
  var reDeeperDotted = DOT.to(deeperDotted);
  var reArrayDotted = DOT.to(deepArrayDotted);
  var reNastyDotted = DOT.to(nastyDeepDotted);

  t.deepEqual(reDotted, objDotted);
  t.deepEqual(reDeeperDotted, deeperDotted);
  t.deepEqual(reArrayDotted, deepArrayDotted);
  t.deepEqual(reNastyDotted, nastyDeepDotted);
});

test('is safe for repeated fromDot... like fromDot then fromDot ad naseum', t => {
  t.plan(4);

  var reFromDotted = DOT.from(obj);
  var reFromDeeperDotted = DOT.from(deeper);
  var reFromArrayDotted = DOT.from(deepArray);
  var reFromNastyDotted = DOT.from(nastyDeep);

  t.deepEqual(reFromDotted, obj);
  t.deepEqual(reFromDeeperDotted, deeper);
  t.deepEqual(reFromArrayDotted, deepArray);
  t.deepEqual(reFromNastyDotted, nastyDeep);
});

test('it handles partial toDots... where part is already dotted', t => {
  t.plan(1);

  var dotted = DOT.to(partialTo);

  t.deepEqual(dotted, partialToDotted);
});

test('it handles partially nested toDots... where part is already dotted then nested', t => {
  t.plan(1);

  var dotted = DOT.to(partialToNested);

  t.deepEqual(dotted, partialToNestedDotted);
});

test('it handles partial fromDots... where part is not dotted', t => {
  t.plan(1);
  var from = DOT.from(partialDotted);
  
  t.deepEqual(from, fromPartialDotted);
});

test('it handles partially nested fromDots... where part is not dotted but nested', t => {
  t.plan(1);

  var from = DOT.from(partialDeepDotted);
  t.deepEqual(from, fromPartialDeepDotted);
});

test('it has a get which is a getByPath, permissive to jsonPath $', t => {
  t.plan(2);

  var val = DOT.get(nastyDeep, "$.foo[1].derp.fiz[0]")
  var val2 = DOT.get(nastyDeep, "$.foo[1].derp.fiz[0]")
  
  t.is(val, "buzz");
  t.is(val2, "buzz");
});

test('it has a get which is a getByPath, returns undefined if not there', t => {
  t.plan(2);

  var val = DOT.get(nastyDeep, "$.foo[1].bong.fiz[0]")
  var val2 = DOT.get(nastyDeep, "$.foo[1].bong.fiz[0]")
  
  t.is(val, undefined);
  t.is(val2, undefined);
});

test('it has a set which is a setByPath, subset of jsonPath $', t => {
  t.plan(2);

  DOT.set(nastyDeep, "$.foo[1].derp.fiz[1]", "bar")  
  var val = DOT.get(nastyDeep, "$.foo[1].derp.fiz[1]")

  DOT.set(nastyDeep, "$.bar.baz", "bong")  
  var val2 = DOT.get(nastyDeep, "$.bar.baz")

  t.is(val, "bar");
  t.is(val2, "bong");
});

