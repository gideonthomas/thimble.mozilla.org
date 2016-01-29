let Nunjucks = require("nunjucks");

module.exports = function templatize(server, paths) {
  let engine = new Nunjucks.Environment(paths.map(path => new Nunjucks.FileSystemLoader(path)), { autoescape: true });

  engine.addFilter("instantiate", input => (new Nunjucks.Template(input)).render(this.getVariables()));

  engine.express(server);
};
