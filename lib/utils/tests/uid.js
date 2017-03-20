"use strict";

const ava = require("ava");
const {test, } = ava;

const UID = require("../uid.js");

test("UID can make you UUID.v1's", t => {
  t.is(typeof UID.v1, "function");
  const v1 = UID.v1();
  t.is(typeof v1, "string");
});

test("UID can make you UUID.v4's", t => {
  t.is(typeof UID.v4, "function");
  const v4 = UID.v4();
  t.is(typeof v4, "string");
});

test("UUID.v1's can be turned into a sortable format", t => {
  t.is(typeof UID.v1Sortable, "function");
  
  const v1 = UID.v1();
  t.is(typeof v1, "string");

  const sortable1 = UID.v1Sortable();
  t.is(typeof sortable1, "string");

  const sortable2 = UID.v1Sortable(v1);
  t.is(typeof sortable2, "string");

  const v1static = "7ceea150-e737-11e6-b591-bbbbab719c85";

  const sortable3 = UID.v1Sortable(v1static);

  t.is(sortable3, "11e6-e737-7ceea150-b591-bbbbab719c85")
});

test("UID can make you UUID.v1's from a seed msecs and nsecs and then extract that afterwards", t => {
  const v11 = UID.v1({
    msecs: 1485813809098,
    nsecs: 40
  });

  t.is(typeof v11, "string");

  const extracted1 = UID.v1Extract(v11);

  t.is(extracted1.msecs, 1485813809098);
  t.is(extracted1.nsecs, 40)

  const v12 = UID.v1({
    msecs: 1485813809098,
    nsecs: 400
  });

  t.is(typeof v12, "string");

  const extracted2 = UID.v1Extract(v12);

  t.is(extracted2.msecs, 1485813809098);
  t.is(extracted2.nsecs, 400)

  const v13 = UID.v1({
    msecs: 1485813809098,
    nsecs: 4000
  });

  t.is(typeof v13, "string");

  const extracted3 = UID.v1Extract(v13);

  t.is(extracted3.msecs, 1485813809098);
  t.is(extracted3.nsecs, 4000)
});

test("UID can make you UUID.v1's from a seed msecs and nsecs but they won't collide", t => {
  const v11 = UID.v1({
    msecs: 1485813809099,
    nsecs: 40
  });

  t.is(typeof v11, "string");

  const v12 = UID.v1({
    msecs: 1485813809099,
    nsecs: 40
  });

  t.is(typeof v12, "string");

  const v13 = UID.v1({
    msecs: 1485813809099,
    nsecs: 40
  });

  t.is(typeof v13, "string");

  t.falsy(v11 == v12)
  t.falsy(v11 == v13)
  t.falsy(v12 == v13) 
});
