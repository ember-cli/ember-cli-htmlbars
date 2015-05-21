'use strict';

module.exports = {
  initializeFeatures: function(templateCompiler, FEATURES) {
    if (FEATURES && templateCompiler) {
      for (var feature in FEATURES) {
        templateCompiler._Ember.FEATURES[feature] = FEATURES[feature];
      }
    }
  },

  template: function(templateCompiler, string, options) {
    var precompiled = templateCompiler.precompile(string, options);
    return 'Ember.HTMLBars.template(' + precompiled + ')';
  }
};
