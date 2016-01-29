/**
 * Module dependencies.
 */
var express = require("express");
var nunjucks = require("nunjucks");
var logger = require("morgan");
var compress = require("compression");
var favicon = require("serve-favicon");
var helmet = require("helmet");
var csrf = require("csurf");
var bodyParser = require("body-parser");
var i18n = require("webmaker-i18n");
var lessMiddleWare = require("less-middleware");
var path = require("path");
var wts = require("webmaker-translation-stats");
var cookieParser = require("cookie-parser");

var middleware = require("./lib/middleware")();
var env = require("./lib/environment");
var utils = require("./lib/utils");
var version = require("./package").version;
var errorhandling = require("./lib/errorhandling");

var app = express();
var appName = "thimble";
var routes = require("./routes")(utils, appName);
var WWW_ROOT = path.resolve(__dirname, "public");

// New stuff
let server = require("express")();

let templatize = require("./templatize");
let request = require("./request");
let security = require("./security");

request.disableHeaders(server, ["x-powered-by"]);

/**
 * Templating engine
 */
templatize(server, ["views", "bower_components"]);

/**
 * Logging
 */
if(env.get("NODE_ENV") === "development") {
  request.log(server, "dev");
}

/**
 * Content compression
 */
request.compress(server);

/**
 * Content Security Policy (CSP)
 */
security.csp(server, {
  frame: [ env.get('BRAMBLE_URI') ],
  script: [ env.get('BRAMBLE_URI') ]
});

/**
 * Thimble Favicon
 */
app.use(favicon(__dirname + '/public/resources/img/favicon.png'));

/**
 * XSS, CSRF and SSL protection
 */
app.use(helmet.xssFilter());
app.use(helmet.noSniff());
if (!!env.get("FORCE_SSL") ) {
  app.use(helmet.hsts());
  app.enable("trust proxy");
}
app.use(csrf());
app.use(helmet.xframe());

/**
 * Request message body configuration
 */
app.use(bodyParser.json({limit: '5MB'}));
app.use(bodyParser.urlencoded({extended: true}));

/**
 * Session configuration
 */
app.use(cookieParser());
app.use(middleware.cookieSession());

var l10n = env.get("L10N");
app.use(i18n.middleware({
  supported_languages: l10n.supported_languages,
  default_lang: "en-US",
  mappings: require("webmaker-locale-mapping"),
  translation_directory: path.resolve(__dirname, l10n.locale_dest)
}));

app.locals.GA_ACCOUNT = env.get("GA_ACCOUNT");
app.locals.GA_DOMAIN = env.get("GA_DOMAIN");
app.locals.languages = i18n.getSupportLanguages();
app.locals.bower_path = "bower_components";

var optimize = (env.get( "NODE_ENV" ) !== "development"),
    tmpDir = path.join( require("os").tmpDir(), "mozilla.webmaker.org");

app.use(lessMiddleWare('public', {
  once: optimize,
  debug: !optimize,
  dest: tmpDir,
  src: WWW_ROOT,
  compress: true,
  yuicompress: optimize,
  optimization: optimize ? 0 : 2
}));

routes.init(app, middleware);

var staticRouter = express.Router();

staticRouter.use(express.static(tmpDir, {maxAge: "1d"}));

// We use pre-built resources in production
if (env.get("NODE_ENV") === "production") {
  staticRouter.use('/', express.static(path.join(__dirname, 'dist'), {maxAge: "1d"}));
} else {
  staticRouter.use('/', express.static(path.join(__dirname, 'public'), {maxAge: "1d"}));
}

staticRouter.use(express.static(path.join(__dirname, 'public/resources'), {maxAge: "1d"}));
staticRouter.use( "/bower", express.static( path.join(__dirname, "bower_components" ), {maxAge: "1d"}));

app.use(staticRouter);

// Localized Strings
app.get( '/strings/:lang?', i18n.stringsRoute( 'en-US' ) );

// DEVOPS - Healthcheck
app.get('/healthcheck', function( req, res ) {
  var healthcheckObject = {
    http: 'okay',
    version: version
  };
  wts(i18n.getSupportLanguages(), path.join(__dirname, 'locale'), function(err, data) {
    if(err) {
      healthcheckObject.locales = err.toString();
    } else {
      healthcheckObject.locales = data;
    }
    res.json(healthcheckObject);
  });
});

// Error handler
app.use(errorhandling.errorHandler);
app.use(errorhandling.pageNotFoundHandler);

// run server
app.listen(env.get("PORT"), function(){
  console.log('Express server listening on ' + env.get("APP_HOSTNAME"));
});
