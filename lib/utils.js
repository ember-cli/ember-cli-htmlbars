'use strict';

function isTemplateCompilationPluginRegistered(plugins) {
  return plugins.some((plugin) => {
    if (Array.isArray(plugin)) {
      let [pluginPathOrInstance, , key] = plugin;
      return (
        pluginPathOrInstance ===
          require.resolve('babel-plugin-ember-template-compilation') &&
        key === 'ember-cli-htmlbars:inline-precompile'
      );
    } else {
      return false;
    }
  });
}

function isColocatedBabelPluginRegistered(plugins) {
  return plugins.some((plugin) => {
    let path = Array.isArray(plugin) ? plugin[0] : plugin;

    return (
      typeof path === 'string' &&
      path === require.resolve('./colocated-babel-plugin')
    );
  });
}

function convertPlugins(wrappers) {
  let launcher = require.resolve('./plugin-launcher.js');
  return (
    wrappers
      .map((wrapper) => {
        if (wrapper.requireFile) {
          return [
            launcher,
            {
              requireFile: wrapper.requireFile,
              buildUsing: wrapper.buildUsing,
              params: wrapper.params,
              type: 'wrapper',
            },
          ];
        }
        if (wrapper.parallelBabel) {
          return [
            launcher,
            {
              requireFile: wrapper.parallelBabel.requireFile,
              buildUsing: wrapper.parallelBabel.buildUsing,
              params: wrapper.parallelBabel.params,
              type: 'plugin',
            },
          ];
        }
        return wrapper.plugin;
      })
      // For historic reasons, our plugins are stored in reverse order, whereas
      // babel-plugin-ember-template-compilation uses the sensible order.
      .reverse()
  );
}

module.exports = {
  convertPlugins,
  isColocatedBabelPluginRegistered,
  isTemplateCompilationPluginRegistered,
};
