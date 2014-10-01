'use strict';

var htmlbarsCompile = require('./index');

module.exports = {
  name: 'ember-cli-htmlbars',
  included: function (app) {
    this._super.included.apply(this, arguments);
    app.registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      toTree: function(tree) {
        return htmlbarsCompile(tree);
      }
    })
  }
}
