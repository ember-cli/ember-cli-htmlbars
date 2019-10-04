'use strict';

let VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  },

  setupPreprocessorRegistry(type, registry) {
    // can only add the plugin with this style on newer Ember versions
    let checker = new VersionChecker(this.project);
    if (checker.forEmber().gte('3.1.0')) {
      registry.add('htmlbars-ast-plugin', this.buildPlugin());
    }

    registry.add('htmlbars-ast-plugin', this.buildLegacyPlugin());
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

  // this type of plugin has worked since at least Ember 2.4+
  buildLegacyPlugin() {
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

      plugin: class LegacyPlugin {
        constructor(options) {
          this.options = options;
        }

        transform(ast) {
          let { meta } = this.options;
          let b = this.syntax.builders;

          this.syntax.traverse(ast, {
            // replacing the mustache with text, like this
            // {{module-name-reverser}} -> `some-module-name`
            MustacheStatement(node) {
              if (node.path.original === 'module-name-reverser') {
                return b.text(
                  meta.moduleName
                    .split('')
                    .reverse()
                    .join('')
                );
              }
            },
          });

          return ast;
        }
      },
    };
  },
};
