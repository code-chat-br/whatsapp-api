import EventEmitter2 from 'eventemitter2';

export const eventeEmitter = new EventEmitter2({
  delimiter: '.',
  newListener: false,
  ignoreErrors: false,
});
