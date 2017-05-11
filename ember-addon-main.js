'use strict';

const path = require('path');
const VersionChecker = require('ember-cli-version-checker');
const utils = require('./utils');
const hashForDep = require('hash-for-dep');

module.exports = {
  name: 'ember-cli-htmlbars',

  init() {
    if (this._super.init) { this._super.init.apply(this, arguments); }

    let checker = new VersionChecker(this);
    let dep = this.emberCLIDep = checker.for('ember-cli', 'npm');
    dep.assertAbove('0.1.2');
  },

  parentRegistry: null,

  shouldSetupRegistryInIncluded() {
    return !this.emberCLIDep.isAbove('0.2.0');
  },

  setupPreprocessorRegistry(type, registry) {
    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      _addon: this,
      toTree(tree) {
        let htmlbarsOptions = this._addon.htmlbarsOptions();
        return require('./index')(tree, htmlbarsOptions);
      },

      precompile(string) {
        let htmlbarsOptions = this._addon.htmlbarsOptions();
        let templateCompiler = htmlbarsOptions.templateCompiler;
        return utils.template(templateCompiler, string);
      }
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }
  },

  included (app) {
    this._super.included.apply(this, arguments);

    if (this.shouldSetupRegistryInIncluded()) {
      this.setupPreprocessorRegistry('parent', app.registry);
    }
  },

  projectConfig() {
    return this.project.config(process.env.EMBER_ENV);
  },

  templateCompilerPath() {
    let config = this.projectConfig();
    let templateCompilerPath = config['ember-cli-htmlbars'] && config['ember-cli-htmlbars'].templateCompilerPath;

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
    let EmberENV = projectConfig.EmberENV || {};
    let templateCompilerPath = this.templateCompilerPath();

    // ensure we get a fresh templateCompilerModuleInstance per ember-addon
    // instance NOTE: this is a quick hack, and will only work as long as
    // templateCompilerPath is a single file bundle
    //
    // (╯°□°）╯︵ ɹǝqɯǝ
    //
    // we will also fix this in ember for future releases
    delete require.cache[templateCompilerPath];

    global.EmberENV = EmberENV; // Needed for eval time feature flag checks
    let pluginInfo = this.astPlugins();

    let htmlbarsOptions = {
      isHTMLBars: true,
      EmberENV: EmberENV,
      templateCompiler: require(templateCompilerPath),
      templateCompilerPath: templateCompilerPath,

      plugins: {
        ast: pluginInfo.plugins
      },

      pluginCacheKey: pluginInfo.cacheKeys
    };

    delete require.cache[templateCompilerPath];
    delete global.Ember;
    delete global.EmberENV;

    return htmlbarsOptions;
  },

  astPlugins() {
    let pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');
    let plugins = [];
    let cacheKeys = [];

    for (let i = 0; i < pluginWrappers.length; i++) {
      let wrapper = pluginWrappers[i];

      plugins.push(wrapper.plugin);

      let providesBaseDir = typeof wrapper.baseDir === 'function';
      let augmentsCacheKey = typeof wrapper.cacheKey === 'function';

      if (providesBaseDir || augmentsCacheKey) {
        if (providesBaseDir) {
          let pluginHashForDep = hashForDep(wrapper.baseDir());
          cacheKeys.push(pluginHashForDep);
        }
        if (augmentsCacheKey) {
          cacheKeys.push(wrapper.cacheKey());
        }
      } else {
        // support for ember-cli < 2.2.0
        let log = this.ui.writeDeprecateLine || this.ui.writeLine;

        log.call(this.ui, 'ember-cli-htmlbars is opting out of caching due to an AST plugin that does not provide a caching strategy: `' + wrapper.name + '`.');
        cacheKeys.push((new Date()).getTime() + '|' + Math.random());
      }
    }

    return {
      plugins: plugins,
      cacheKeys: cacheKeys
    };
  }
};
