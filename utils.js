'use strict';

module.exports = {
  initializeEmberENV(templateCompiler, EmberENV) {
    if (!templateCompiler || !EmberENV) { return; }

    let props;

    if (EmberENV.FEATURES) {
      props = Object.keys(EmberENV.FEATURES);

      props.forEach(prop => {
        templateCompiler._Ember.FEATURES[prop] = EmberENV.FEATURES[prop];
      });
    }

    if (EmberENV) {
      props = Object.keys(EmberENV);

      props.forEach(prop => {
        if (prop === 'FEATURES') { return; }

        templateCompiler._Ember.ENV[prop] = EmberENV[prop];
      });
    }
  },

  precompile(templateCompiler, string, options) {
    return templateCompiler.precompile(string, options);
  },

  template(templateCompiler, string, options) {
    let precompiled = this.precompile(string, options);
    return `Ember.HTMLBars.template(${precompiled})`;
  }
};
