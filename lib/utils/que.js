'use strict';

const createRegex = require('./urn.js').createRegex;

function QUE(opts) {
  opts = opts || {};

  let items = [];
  let regexes = {};

  let __i__ = 0;

  function _i_() {
    return __i__++;
  }

  function _emitGet(urn, matches, i, cb) {
    try {
      let item = items[i];
      cb.call(null, item.args, {
        key: item.key,
        urn: item.urn,
        getUrn: urn,
        matches: matches,
      });

      items.splice(i, 1);
    } catch (e) {}
  }

  this.add = (urn, args) => {
    let key = `${_i_()}`;

    items.push({
      key: key,
      urn: urn,
      args: args,
    });

    return {
      key: key,
      urn: urn,
    };
  };

  this.remove = (urn, key) => {
    for (var i = 0; i < items.length; i++) {
      if (items[i].key === key) {
        items[i] = null;
        items.splice(i, 1);
        break;
      }
    }

    return;
  };

  this.get = (urn, cb) => {
    let regex = regexes[urn];
    if (!regex) {
      regex = regexes[urn] = createRegex(urn);
    }

    for (var i = 0; i < items.length; i++) {
      if (items[i].urn === urn) {
        _emitGet(urn, [urn], i, cb);
        break;
      }

      let matches = regex.exec(items[i].urn);
      if (matches) {
        matches.splice(0, 1);
        _emitGet(urn, matches, i, cb);
        break;
      }
    }

    return;
  };

  if (opts.DEBUG === 'DEBUG') {
    this.items = () => {
      return items;
    };
  }

  return this;
}

module.exports = QUE;
