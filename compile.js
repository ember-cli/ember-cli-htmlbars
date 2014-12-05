var compileSpec = require('htmlbars').compileSpec;
var handlbarsTemplateCompiler = require('ember-template-compiler');

var eachTransform = require('./ext/plugins/transform-each-in-to-hash');
var withTransform = require('./ext/plugins/transform-with-as-to-hash');

var defaultHTMLBarsOptions = {
  disableComponentGeneration: true,

  plugins: {
    ast: [
      eachTransform,
      withTransform
    ]
  }
};

module.exports = function(string, htmlbarsOptions) {
  if (htmlbarsOptions === true) {
    htmlbarsOptions = defaultHTMLBarsOptions;
  }

  if (htmlbarsOptions) {
    return "export default Ember.HTMLBars.template(" + compileSpec(string, htmlbarsOptions) + ");";
  } else {
    var input = handlbarsTemplateCompiler.precompile(string, false);
    return "export default Ember.Handlebars.template(" + input + ")";
  }
};
