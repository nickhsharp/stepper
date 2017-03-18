'use strict';

const dns = require('dns');

const original = {
  lookup: dns.lookup,
  resolve: dns.resolve,
  resolve4: dns.resolve4,
  resolve6: dns.resolve6,
  resolveMx: dns.resolveMx,
  resolveTxt: dns.resolveTxt,
  resolveSrv: dns.resolveSrv,
  resolveNs: dns.resolveNs,
  resolveCname: dns.resolveCname,
  reverse: dns.reverse,
};

var DEFAULT_TTL = 300;

const _store = {};
const _cache = {
  get(slug) {
    if (_store[slug] && _store[slug].ttl > Date.now()) {
      return _store[slug].value;
    }

    return;
  },

  set(slug, value, ttl) {
    ttl = ttl || DEFAULT_TTL;

    _store[slug] = {
      value: value,
      ttl: Date.now() + (ttl * 1000),
    };
  },
};

function resolveShim(which) {
  return function(domain, callback) {
    const slug = `${which}:${domain}`;
    const hit = _cache.get(slug);

    if (hit) {
      return callback(undefined, hit);
    } else {
      try {
        original[which](domain, (err, addresses) => {
          if (err) {
            return callback(err);
          }

          _cache.set(slug, addresses);
          return callback(undefined, addresses);
        });
      } catch (err) {
        return callback(err);
      }
    }
  };
}

const cachedDNS = {
  lookup(domain, options, callback) {
    var family = 0;
    var hints = 0;
    var all = false;

    if (arguments.length === 2) {
      callback = options;
      options = family;
    } else if (typeof options === 'object') {
      if (options.family) {
        family = +options.family;
        if (family !== 4 && family !== 6) {
          return callback(new Error("invalid argument: 'family' must be 4 or 6"));
        }
      }

      if (options.hints) {
        hints = +options.hints;
      }

      all = (options.all === true);
    } else if (options) {
      family = +options;
      if (family !== 4 && family !== 6) {
        return callback(new Error("invalid argument: 'family' must be 4 or 6"));
      }
    }

    const slug = `lookup:${domain}:${family}:${hints}:${all}`;
    const hit = _cache.get(slug);

    if (hit) {
      if (Array.isArray(hit)) {
        return callback(undefined, hit);
      }

      return callback(undefined, hit.address, hit.family);
    } else {
      try {
        original.lookup(domain, options, (err, address, familyR) => {
          if (err) {
            return callback(err);
          }

          let ret;
          if (Array.isArray(address)) {
            ret = address;
          } else {
            ret = {
              address: address,
              family: familyR,
            };
          }

          _cache.set(slug, ret);
          return callback(undefined, address, familyR);
        });
      } catch (err) {
        return callback(err);
      }
    }
  },

  resolve(domain, type, callback) {
    var typeNew;
    var callbackNew;

    if (typeof type !== 'string') {
      type = 'A';
      callback = type;
    }

    const slug = `resolve:${domain}:${typeNew}`;
    const hit = _cache.get(slug);

    if (hit) {
      return callback(undefined, hit, true);
    } else {
      try {
        original.resolve(domain, type, (err, addresses) => {
          if (err) {
            return callback(err);
          }

          _cache.set(slug, addresses);
          return callback(undefined, addresses, false);
        });
      } catch (err) {
        return callback(err);
      }
    }
  },

  resolve4: resolveShim('resolve4'),
  resolve6: resolveShim('resolve6'),
  resolveMx: resolveShim('resolveMx'),
  resolveTxt: resolveShim('resolveTxt'),
  resolveSrv: resolveShim('resolveSrv'),
  resolveNs: resolveShim('resolveNs'),
  resolveCname: resolveShim('resolveCname'),
  reverse: resolveShim('reverse'),
};

function reset() {
  for (var key in original) {
    dns[key] = original[key];
  }
}

function cache() {
  for (var key in cachedDNS) {
    dns[key] = cachedDNS[key];
  }
}

function init(options) {
  if (options && options.ttl) {
    DEFAULT_TTL = options.ttl;
  }

  return {
    cache,
    reset,
    original,
  };
}

module.exports = init;
