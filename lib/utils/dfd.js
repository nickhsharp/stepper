'use strict';

function DFD() {
  var _resolve;
  var _reject;

  this.promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  this.then = this.promise.then.bind(this.promise);

  this.resolve = (data) => {
    _resolve(data);
    return this.promise;
  };

  this.reject = (err) => {
    _reject(err);
    return this.promise;
  };

  return this;
}

module.exports = DFD;
