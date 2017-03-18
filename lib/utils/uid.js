"use strict";

const crypto = require("crypto");

const bth = [];
const htb = {};
for (var i = 0; i < 256; i++) {
  bth[i] = (i + 0x100).toString(16).substr(1);
  htb[bth[i]] = i;
}

function btu(buf) {
  let i = 0;
  return `${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}-${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}${bth[buf[i++]]}`;
}

function utb(str) {
  var i = 0, ii = 0;

  const buf = [];
  str.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = htb[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

const _seedBytes = crypto.randomBytes(16);

// create an 48-bit node id, (47 random bits + multicast bit = 1)
const nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// randomize (14 bit) clockseq
var clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var lastMSecs = 0, lastNSecs = 0;


function v1(options) {
  let i = 0;
  const buf = [];
  options = options || {};

  let msecs = options.msecs !== undefined ? options.msecs : Date.now();
  let nsecs = options.nsecs !== undefined ? options.nsecs : lastNSecs + 1;
  
  const delta = (msecs - lastMSecs) + (nsecs - lastNSecs)/10000;

  // Bump clockseq on clock regression
  // or clock overflow (more than 10000 ficticious nsecs)s
  // or an exact match in millis and nanos (highly improbably ever)
  if (delta <= 0) {
    clockseq = clockseq + 1 & 0x3fff;
    if(!options.nsecs) {
      nsecs = 0;
    }
  }

  if(nsecs >= 10000) {
    clockseq = clockseq + 1 & 0x3fff;
    nsecs = 0;
  }

  // Reset nsecs if we've moved onto a new time interval
  if (msecs > lastMSecs && !options.nsecs) {
    nsecs = 0;
  }

  lastMSecs = msecs;
  lastNSecs = nsecs;

  // Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  const tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  buf[i++] = tl >>> 24 & 0xff;
  buf[i++] = tl >>> 16 & 0xff;
  buf[i++] = tl >>> 8 & 0xff;
  buf[i++] = tl & 0xff;

  // `time_mid`
  const tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  buf[i++] = tmh >>> 8 & 0xff;
  buf[i++] = tmh & 0xff;

  // `time_high_and_version`
  buf[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  buf[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (include variant)
  buf[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  buf[i++] = clockseq & 0xff;

  for(let n = 0; n < 6; ++n) {
    buf[i + n] = nodeId[n];
  }

  return btu(buf);
}

function v4() {
  const rnds = crypto.randomBytes(16);

  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  return btu(rnds);
}

function v1Extract(str) {
  let msecs = 0, nsecs = 0, i = 0;

  const buf = utb(str);

  // inspect version at offset 6
  if ((buf[i+6]&0x10)!=0x10) {
    return {
      msecs: null,
      nsecs: null
    }
  }

  // 'time_low'
  let tl = 0;

  tl |= ( buf[i++] & 0xff ) << 24;
  tl |= ( buf[i++] & 0xff ) << 16;
  tl |= ( buf[i++] & 0xff ) << 8;
  tl |=   buf[i++] & 0xff ;

  // `time_mid`
  let tmh = 0;
  tmh |= ( buf[i++] & 0xff ) << 8;
  tmh |=   buf[i++] & 0xff;

  // `time_high_minus_version`
  tmh |= ( buf[i++] & 0xf ) << 24; 
  tmh |= ( buf[i++] & 0xff ) << 16;

  // // account for the sign bit
  let partialTl = 1.0 * ( ( tl >>> 1 ) * 2 + ( ( tl & 0x7fffffff ) % 2 ) );
  msecs = partialTl / 10000.0;

  msecs += 1.0 * ( ( tmh >>> 1 ) * 2 + ( ( tmh & 0x7fffffff ) % 2 ) ) * 0x100000000 / 10000.0;
 
  // determine nano seconds by jankily determining the tl as if you had set the nano's to 0
  const temptl = ((msecs & 0xfffffff) * 10000 + 0) % 0x100000000;
  nsecs = partialTl - temptl;

  // Convert from Gregorian epoch to unix epoch
  msecs -= 12219292800000;
  msecs = Math.round(msecs);

  return {
    msecs,
    nsecs,
  };
}

function v1Sortable(str) {
  if(!str) {
    str = v1();
  }
  console.log(str)
  return str.replace(/^(.{8})-(.{4})-(.{4})/, '$3-$2-$1');
}

function v1SortableExtract(str) {
  if(!str) {
    str = v1();
  }
  let uid = str.replace(/^(.{4})-(.{4})-(.{8})/, '$3-$2-$1');
  return v1Extract(uid);
}

module.exports = {
  v1,
  v4,
  v1Sortable,
  v1Extract,
  v1SortableExtract,
}
