'use strict';

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  setupPreprocessorRegistry(type, registry) {
    // can only add the plugin with this style on newer Ember versions
    registry.add('htmlbars-ast-plugin', this.buildPlugin());
  },

  buildPlugin() {
    // https://astexplorer.net/#/gist/7c8399056873e1ddbd2b1acf0a41592a/e08f2f850de449b77b8ad995085496a1100dfd1f
    return {
      name: 'module-name-inliner',
      baseDir() {
        return __dirname;
      },
      parallelBabel: {
        requireFile: __filename,
        buildUsing: 'buildPlugin',
        params: {},
      },
      plugin(env) {
        let { builders } = env.syntax;

        return {
          name: 'module-name-inliner',

          visitor: {
            PathExpression(node) {
              if (node.original === 'module-name-inliner') {
                // replacing the path with a string literal, like this
                // {{"the-module-name-here"}}
                return builders.string(env.moduleName);
              }
            },
          },
        };
      },
    };
  },
};
