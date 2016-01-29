let hood = require("hood");
const defaultTrustedDomains = {
  default: [ "'self'" ],
  connection: [ "'self'" ],
  frame: [
          "'self'",
          "https://docs.google.com"],
  font: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://netdna.bootstrapcdn.com",
          "https://code.cdn.mozilla.net/"
        ],
  image: [ "*" ],
  media: [ "*" ],
  script: [
            "'self'",
            "http://mozorg.cdn.mozilla.net",
            "https://ajax.googleapis.com",
            "https://mozorg.cdn.mozilla.net",
            "https://www.google-analytics.com"
          ],
  stylesheet: [
                "'self'",
                "http://mozorg.cdn.mozilla.net",
                "https://ajax.googleapis.com",
                "https://fonts.googleapis.com",
                "https://mozorg.cdn.mozilla.net",
                "https://netdna.bootstrapcdn.com"
              ]
};

module.exports = {
  csp(server, domainList) {
    domainList = domainList || {};
    Object.keys(defaultTrustedDomains).forEach(mimeType => {
      let domainsToAdd = domainList[mimeType];
      let defaultDomains = defaultTrustedDomains[mimeType];

      if(domainsToAdd && defaultDomains.indexOf("*") !== -1) {
        domainList[mimeType] = domainsToAdd;
      } else {
        domainList[mimeType] = defaultDomains.concat((domainsToAdd || []));
      }
    });

    server.use(hood.csp({
      headers: [ "Content-Security-Policy-Report-Only" ],
      policy: {
        "default-src": domainList.default,
        "connect-src": domainList.connection,
        "frame-src": domainList.frame,
        "font-src": domainList.font,
        "img-src": domainList.image,
        "media-src": domainList.media,
        "script-src": domainList.script,
        "style-src": domainList.stylesheet
      }
    }));
  }
};
