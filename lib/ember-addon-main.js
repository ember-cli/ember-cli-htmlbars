'use strict';

const path = require('path');
const utils = require('./utils');
const logger = require('heimdalljs-logger')('ember-cli-htmlbars:addon');
const hasEdition = require('@ember/edition-utils').has;

let registryInvocationCounter = 0;

module.exports = {
  name: require('../package').name,

  parentRegistry: null,

  _shouldColocateTemplates() {
    if (this._cachedShouldColocateTemplates) {
      return this._cachedShouldColocateTemplates;
    }

    const semver = require('semver');

    let babel = this.parent.addons.find(a => a.name === 'ember-cli-babel');
    let hasBabel = babel !== undefined;
    let babelVersion = hasBabel && babel.pkg.version;

    // using this.project.emberCLIVersion() allows us to avoid issues when `npm
    // link` is used; if this addon were linked and we did something like
    // `require('ember-cli/package').version` we would get our own ember-cli
    // version **not** the one in use currently
    let emberCLIVersion = this.project.emberCLIVersion();

    let hasValidBabelVersion = hasBabel && semver.gte(babelVersion, '7.11.0');
    let hasValidEmberCLIVersion = semver.gte(emberCLIVersion, '3.12.0-beta.2');
    let hasOctane = hasEdition('octane');

    this._cachedShouldColocateTemplates =
      hasOctane && hasValidBabelVersion && hasValidEmberCLIVersion;

    logger.info(
      `Colocation processing: ${this._cachedShouldColocateTemplates} (hasOctane: ${hasOctane}; hasValidEmberCLIVersion: ${hasValidEmberCLIVersion}; hasVali
dBabelVersion: ${hasValidBabelVersion};`
    );

    return this._cachedShouldColocateTemplates;
  },

  setupPreprocessorRegistry(type, registry) {
    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    // when this.parent === this.project, `this.parent.name` is a function 😭
    let parentName = typeof this.parent.name === 'function' ? this.parent.name() : this.parent.name;

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      _addon: this,
      toTree(tree) {
        let debugTree = require('broccoli-debug').buildDebugCallback(
          `ember-cli-htmlbars:${parentName}:tree-${registryInvocationCounter++}`
        );

        let shouldColocateTemplates = this._addon._shouldColocateTemplates();
        let htmlbarsOptions = this._addon.htmlbarsOptions();

        let inputTree = debugTree(tree, '01-input');

        if (shouldColocateTemplates) {
          const ColocatedTemplateProcessor = require('./colocated-broccoli-plugin');

          inputTree = debugTree(new ColocatedTemplateProcessor(inputTree), '02-colocated-output');
        }

        const TemplateCompiler = require('./template-compiler-plugin');
        return debugTree(new TemplateCompiler(inputTree, htmlbarsOptions), '03-output');
      },

      precompile(string, options) {
        let htmlbarsOptions = this._addon.htmlbarsOptions();
        let templateCompiler = htmlbarsOptions.templateCompiler;

        return utils.template(templateCompiler, string, options);
      },
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }

    let legacyInlinePrecompileAddon = this.parent.addons.find(
      a => a.name === 'ember-cli-htmlbars-inline-precompile'
    );
    if (legacyInlinePrecompileAddon !== undefined) {
      let heirarchy = ['ember-cli-htmlbars-inline-precompile'];
      let pointer = this;
      while (pointer.parent) {
        heirarchy.push(pointer.pkg.name);
        pointer = pointer.parent;
      }

      this.ui.writeDeprecateLine(
        `${heirarchy
          .reverse()
          .join(
            ' > '
          )} is no longer needed with ember-cli-htmlbars versions 4.0.0 and higher, please remove it from \`${
          this.parent.root
        }/package.json\``
      );

      // overwrite the `included` method on the
      // ember-cli-htmlbars-inline-precompile instance this prevents issues
      // when using ember-cli-htmlbars-inline-precompile < 3.0.1 (where both
      // this addon and ember-cli-htmlbars-inline-precompile use the same
      // babel-plugin-htmlbars-inline-precompile version and get confused about
      // whether or not it registers its replacements)
      //
      // this only mutates the local addon _instance_ (not **all** instances of
      // the addon) because we _know_ that this instance of ember-cli-htmlbars
      // will take care of the precompilation of:
      //
      // import hbs from 'htmlbars-inline-precompile';
      // import hbs from 'ember-cli-htmlbars-inline-precompile';
      legacyInlinePrecompileAddon.included = function() {};
    }
  },

  included() {
    this._super.included.apply(this, arguments);

    let addonOptions = this._getAddonOptions();
    addonOptions.babel = addonOptions.babel || {};
    addonOptions.babel.plugins = addonOptions.babel.plugins || [];
    let babelPlugins = addonOptions.babel.plugins;

    // add the babel-plugin-htmlbars-inline-precompile to the list of plugins
    // used by `ember-cli-babel` addon
    if (!this._isInlinePrecompileBabelPluginRegistered(babelPlugins)) {
      let pluginInfo = this.astPlugins();
      let templateCompilerPath = this.templateCompilerPath();

      let modules = {
        'ember-cli-htmlbars': 'hbs',
        'ember-cli-htmlbars-inline-precompile': 'default',
        'htmlbars-inline-precompile': 'default',
      };

      if (pluginInfo.canParallelize) {
        logger.debug('using parallel API with for babel inline precompilation plugin');

        let parallelBabelInfo = {
          requireFile: path.join(__dirname, 'require-from-worker'),
          buildUsing: 'build',
          params: {
            templateCompilerPath,
            parallelConfigs: pluginInfo.parallelConfigs,
            modules,
          },
        };

        // parallelBabelInfo will not be used in the cache unless it is explicitly included
        let cacheKey = utils.makeCacheKey(
          templateCompilerPath,
          pluginInfo,
          JSON.stringify(parallelBabelInfo)
        );

        babelPlugins.push({
          _parallelBabel: parallelBabelInfo,
          baseDir: () => __dirname,
          cacheKey: () => cacheKey,
        });
      } else {
        logger.debug('NOT using parallel API with for babel inline precompilation plugin');
        logger.debug('Prevented by these plugins: ' + pluginInfo.unparallelizableWrappers);

        let htmlBarsPlugin = utils.setup(pluginInfo, {
          projectConfig: this.projectConfig(),
          templateCompilerPath,
          modules,
        });

        babelPlugins.push(htmlBarsPlugin);
      }
    }

    if (this._shouldColocateTemplates()) {
      const { hasPlugin, addPlugin } = require('ember-cli-babel-plugin-helpers');
      let colocatedPluginPath = require.resolve('./colocated-babel-plugin');

      if (!hasPlugin(babelPlugins, colocatedPluginPath)) {
        addPlugin(babelPlugins, colocatedPluginPath);
      }
    }
  },

  /**
   * This function checks if 'babel-plugin-htmlbars-inline-precompile' is already present in babelPlugins.
   * The plugin object will be different for non parallel API and parallel API.
   * For parallel api, check the `baseDir` of a plugin to see if it has current dirname
   * For non parallel api, check the 'modules' to see if it contains the babel plugin
   * @param {*} plugins
   */
  _isInlinePrecompileBabelPluginRegistered(plugins) {
    return plugins.some(plugin => {
      if (Array.isArray(plugin)) {
        let [pluginPathOrInstance, options] = plugin;

        return (
          pluginPathOrInstance === require.resolve('babel-plugin-htmlbars-inline-precompile') &&
          typeof options.modules === 'object' &&
          options.modules['ember-cli-htmlbars'] === 'hbs'
        );
      } else if (
        plugin !== null &&
        typeof plugin === 'object' &&
        plugin._parallelBabel !== undefined
      ) {
        return (
          plugin._parallelBabel.requireFile ===
            path.resolve(__dirname, 'lib/require-from-worker') &&
          typeof plugin._parallelBabel.params === 'object' &&
          typeof plugin._parallelBabel.params.modules === 'object' &&
          plugin._parallelBabel.params.modules['ember-cli-htmlbars'] === 'hbs'
        );
      } else {
        return false;
      }
    });
  },

  projectConfig() {
    return this.project.config(process.env.EMBER_ENV);
  },

  _getAddonOptions() {
    return (this.parent && this.parent.options) || (this.app && this.app.options) || {};
  },

  templateCompilerPath() {
    let config = this.projectConfig();
    let templateCompilerPath =
      config['ember-cli-htmlbars'] && config['ember-cli-htmlbars'].templateCompilerPath;

    let ember = this.project.findAddonByName('ember-source');
    if (ember) {
      return ember.absolutePaths.templateCompiler;
    } else if (!templateCompilerPath) {
      templateCompilerPath = this.project.bowerDirectory + '/ember/ember-template-compiler';
    }

    let absolutePath = path.resolve(this.project.root, templateCompilerPath);

    if (path.extname(absolutePath) === '') {
      absolutePath += '.js';
    }

    return absolutePath;
  },

  htmlbarsOptions() {
    let projectConfig = this.projectConfig() || {};
    let templateCompilerPath = this.templateCompilerPath();
    let pluginInfo = this.astPlugins();

    return utils.buildOptions(projectConfig, templateCompilerPath, pluginInfo);
  },

  astPlugins() {
    let pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');

    return utils.setupPlugins(pluginWrappers);
  },
};
