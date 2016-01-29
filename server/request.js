let compression = require("compression");
let logger = require("morgan");

module.exports = {
  compress(server) {
    server.use(compression());
  },
  disableHeaders(server, headers) {
    headers.forEach(header => server.disable(header));
  },
  log(server, mode) {
    server.use(logger(mode));
  }
};
