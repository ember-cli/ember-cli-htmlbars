'use strict';

var htmlbarsCompile = require('./index');

module.exports = {
  name: 'ember-cli-htmlbars',
  included: function (app) {
    var HTMLBars = app.project.config(app.env).EmberENV.FEATURES.HTMLBars

    this._super.included.apply(this, arguments);

    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    app.registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    app.registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {
        return htmlbarsCompile(tree, { HTMLBars: HTMLBars });
      }
    })
  }
}
