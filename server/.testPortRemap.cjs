const http = require('http');

const remapOptions = (options) => {
  if (!options || typeof options !== 'object') return options;
  const host = options.hostname || options.host;
  if (Number(options.port) === 5000 && (host === '127.0.0.1' || host === 'localhost')) {
    return { ...options, port: 5003 };
  }
  return options;
};

const originalRequest = http.request;
http.request = function request(options, ...args) {
  return originalRequest.call(this, remapOptions(options), ...args);
};

const originalGet = http.get;
http.get = function get(options, ...args) {
  return originalGet.call(this, remapOptions(options), ...args);
};

const originalFetch = global.fetch;
global.fetch = function fetch(input, init) {
  if (typeof input === 'string' || input instanceof URL) {
    const url = new URL(input);
    if (url.port === '5000' && (url.hostname === '127.0.0.1' || url.hostname === 'localhost')) {
      url.port = '5003';
      return originalFetch.call(this, url, init);
    }
  }
  return originalFetch.call(this, input, init);
};
