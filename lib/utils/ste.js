'use strict';

function STE(_hub, urn, state) {

  const hub = _hub;
  const prefaceUrn = urn;
  const _default = state || 'default';
  let currentState = _default;
  let prevData = {};

  this.on = (urn, cb, times) => {
    return hub.on(`${prefaceUrn}:${urn}`, cb, times);
  };

  this.once = (urn, cb) => {
    return hub.on(`${prefaceUrn}:${urn}`, cb, 1);
  };

  this.set = (state, data) => {
    hub.emit(`${prefaceUrn}:leaving/${currentState}`, data);
    hub.emit(`${prefaceUrn}:left/${currentState}`, data);

    currentState = _default;
    hub.emit(`${prefaceUrn}:entering/${state}`, data);

    currentState = state;
    hub.emit(`${prefaceUrn}:entered/${currentState}`, data);

    prevData = data;
  };

  this.refresh = () => {
    hub.emit(`${prefaceUrn}:entered/${currentState}`, prevData);
  };

  this.describe = () => {
    return {
      urn: prefaceUrn,
      state: currentState,
    };
  };

  hub.emit(`${prefaceUrn}:entering/${currentState}`, prevData);
  hub.emit(`${prefaceUrn}:entered/${currentState}`, prevData);

  return this;
}

module.exports = STE;
