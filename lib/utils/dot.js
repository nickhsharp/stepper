'use strict';

const TYP = require('./typ.js');

function toDot(obj) {
  var out = {};

  for (let key in obj) {

    if (TYP.isObject(obj[key])) {

      let inner = toDot(obj[key]);
      for (let innerKey in inner) {
        out[`${key}.${innerKey}`] = inner[innerKey];
      }
    } else if (TYP.isArray(obj[key])) {

      obj[key].forEach((item, index) => {
        if (TYP.isObject(item) || TYP.isArray(item)) {
          let inner = toDot(item);

          for (let innerKey in inner) {
            out[`${key}.[${index}].${innerKey}`] = inner[innerKey];
          }
        } else {
          out[`${key}.[${index}]`] = item;
        }
      });
    } else {

      out[key] = obj[key];
    }
  }

  return out;
}

const dottedArrayPattern = /^\[(\d+)\]$/;

function fromDot(obj) {
  var out = {};

  for (var key in obj) {

    if (TYP.isArray(obj[key])) {
      obj[key].forEach((item, index) => {
        if (TYP.isArray(item) || TYP.isObject(item)) {
          obj[key][index] = fromDot(item);
        } else {
          obj[key][index] = item;
        }
      });
    } else if (TYP.isObject(obj[key])) {
      obj[key] = fromDot(obj[key]);
    }

    let target = out;
    let arr = key.split('.');
    for (let i = 0; i < arr.length; i++) {

      let item = arr[i];
      if (i < arr.length - 1) {

        let match = dottedArrayPattern.exec(arr[i + 1]);
        if (match) {

          target[item] = target[item] || [];
          if (i + 1 === arr.length - 1) {
            target[item][match[1]] = obj[key];
          } else {
            target[item][match[1]] = target[item][match[1]] || {};
            target = target[item][match[1]];
          }

          i++;
        } else {
          target[item] = target[item] || {};
          target = target[item];
        }
      } else {
        target[item] = obj[key];
        target = target[item];
      }
    }
  }

  return out;
}

module.exports = {
  to: toDot,
  from: fromDot,
};
