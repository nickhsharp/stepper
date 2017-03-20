"use strict";

const TYP = require("./typ.js");
const arrayPattern = /^\[(\d+)\]$/;
const arrayPartPattern = /(.*)(\[\d+\])$/;

function partsFromString(str) {
  let parts = str.split(".");
  let out = [];

  parts.forEach((item) => {
    let match = arrayPartPattern.exec(item);
    if(match) {
      out.push(match[1]);
      out.push(match[2]);
    } else if (item != "$") {
      out.push(item);
    }
  });

  return out;
}

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
            out[`${key}[${index}].${innerKey}`] = inner[innerKey];
          }

        } else {
          out[`${key}[${index}]`] = item;
        }
      });
    } else {
      out[key] = obj[key];
    }
  }

  return out;
}


function fromDot(obj) {
  let dotted = toDot(obj);
  let out = {};

  for(let key in dotted) {
    setByPath(out, key, dotted[key]);

    if(TYP.isArray(out[key]) || TYP.isObject(out[key])) {
      // recurse in case it had nested dotted style
      out[key] = fromDot(out[key]); 
    }
  }

  return out;
}

/*
  simplified JSON path getter.  Works with the same toDot/fromDot pattern
*/
function getByPath(obj, path) {
  return partsFromString(path).reduce((prev, curr) => {
    let match = arrayPattern.exec(curr);
    if (match) {
      return prev ? prev[match[1]] : undefined;
    } else {
      return prev ? prev[curr] : undefined;
    }
  }, obj);
}

/*
  simplified JSON path setter.  Works with the same toDot/fromDot pattern
*/
function setByPath(obj, path, value) {
  partsFromString(path).reduce((prev, curr, i, arr) => {
    let target = {};
    if(i == arr.length - 1) {
      target = value;
    } else if(arrayPattern.exec(arr[i+1])) {
      target = [];
    } 

    let match = arrayPattern.exec(curr);
    if (match) {
      prev = prev || [];
      return prev[match[1]] = prev[match[1]] || target;
    } else {
      return prev[curr] = prev[curr] || target;
    }

  }, obj);
}

module.exports = {
  to: toDot,
  from: fromDot,
  get: getByPath,
  set: setByPath,
};
