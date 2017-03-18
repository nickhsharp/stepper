'use strict';

const createRegex = require('./urn.js').createRegex;

function HUB(opts) {
  opts = opts || {};

  let bindings = {};
  let history = [];

  let __i__ = 0;

  function _i_() {
    return __i__++;
  }

  function _emitSubs(boundUrn, matches, urn, args) {

    let subs = bindings[boundUrn].subs;

    for (var key in subs) {
      try {
        subs[key].cb.call(null, args, {
          key: key,
          urn: urn,
          boundUrn: boundUrn,
          matches: matches,
        });

        subs[key].times--;
        if (subs[key].times === 0) {
          delete subs[key];
        }
      } catch (e) {
        console.error('HUB EMIT CALLBACK THREW', boundUrn, matches, urn, args, subs[key]);
        console.error(e, e.stack, e.message);
      }
    }
  }

  this.on = (urn, cb, times) => {
    let key = `${_i_()}`;

    bindings[urn] = bindings[urn] || {
      subs: {},
    };
    bindings[urn].regex = bindings[urn].regex || createRegex(urn);
    bindings[urn].subs[key] = {
      cb: cb,
      times: times || 0,
    };

    return {
      key: key,
      urn: urn,
    };
  };

  this.once = (urn, cb) => {
    return this.on(urn, cb, 1);
  };

  this.off = (urn, key) => {
    if (bindings[urn]) {
      delete bindings[urn].subs[key];
    }

    return;
  };

  this.emit = (urn, args) => {
    args = args || {};

    for (var boundUrn in bindings) {
      if (boundUrn !== urn) {
        let matches = bindings[boundUrn].regex.exec(urn);
        if (matches) {
          matches.splice(0, 1);
          _emitSubs(boundUrn, matches, urn, args);
        }
      } else {
        _emitSubs(boundUrn, [urn], urn, args);
      }
    }

    if (opts.DEBUG === 'DEBUG') {
      history.push({
        urn: urn,
        args: args,
      });
    }

    return;
  };

  if (opts.DEBUG === 'DEBUG') {
    this.history = () => {
      return history;
    };
  }

  return this;
}

module.exports = HUB;
