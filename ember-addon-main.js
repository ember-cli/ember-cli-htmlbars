'use strict';

var htmlbarsCompile = require('./index');

module.exports = {
  name: 'ember-cli-htmlbars',
  included: function (app) {
    var projectConfig = app.project.config(app.env);
    var htmlbarsEnabled = projectConfig.EmberENV.FEATURES['ember-htmlbars'];
    var htmlbarsComponentGeneration = projectConfig.EmberENV.FEATURES['ember-htmlbars-component-generation'];

    if (htmlbarsEnabled) {
      var htmlbarsOptions = {
        disableComponentGeneration: htmlbarsComponentGeneration !== true
      };
    }

    this._super.included.apply(this, arguments);

    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    app.registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    app.registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {
        return htmlbarsCompile(tree, { htmlbarsOptions: htmlbarsOptions });
      }
    })
  }
}
