'use strict';

const path = require('path');
const utils = require('./utils');
const hashForDep = require('hash-for-dep');
const VersionChecker = require('ember-cli-version-checker');

// used as a way to memoize canAvoidCacheBusting so that we can avoid many many
// top down searches of the addon heirarchy
const NEEDS_CACHE_BUSTING = new WeakMap();

function canAvoidCacheBusting(project) {
  if (NEEDS_CACHE_BUSTING.has(project)) {
    return NEEDS_CACHE_BUSTING.get(project);
  }

  let checker = new VersionChecker(project);
  let emberVersion = checker.forEmber();

  let hasLegacyHTMLBarsAddons = checkAddonsForLegacyVersion(project);

  let needsCacheBusting = hasLegacyHTMLBarsAddons || emberVersion.lt('1.13.0');
  NEEDS_CACHE_BUSTING.set(project, !!needsCacheBusting);

  return needsCacheBusting;
}

function checkAddonsForLegacyVersion(addon) {
  let registry = addon.registry;

  let plugins = registry && registry.load('htmlbars-ast-plugin');
  let hasPlugins = plugins && plugins.length > 0;

  if (hasPlugins) {
    let htmlbarsInstance = addon.addons.find(addon => addon.name === 'ember-cli-htmlbars');
    if (!htmlbarsInstance || htmlbarsInstance.legacyPluginRegistrationCacheBustingRequired !== false) {
      return true;
    }

    let inlineHTMLBarsCompileInstance = addon.addons.find(addon => addon.name === 'ember-cli-htmlbars-inline-precompile');
    if (!inlineHTMLBarsCompileInstance || inlineHTMLBarsCompileInstance.legacyPluginRegistrationCacheBustingRequired !== false) {
      return true;
    }
  }

  return addon.addons.some(checkAddonsForLegacyVersion);
}

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    // default to `true`
    this.legacyPluginRegistrationCacheBustingRequired = true;
  },

  included() {
    this._super.included.apply(this, arguments);

    // populated lazily to ensure that the registries throughout the entire
    // project are populated
    //
    // population happens in setupPreprocessorRegistry hook, which is called in
    // `lib/broccoli/ember-app.js` constructor and `lib/models/addon.js`
    // constructor in ember-cli itself
    this.legacyPluginRegistrationCacheBustingRequired = canAvoidCacheBusting(this.project);
  },

  parentRegistry: null,

  purgeModule(templateCompilerPath) {
    // do nothing if we are operating in the "new world" and avoiding
    // global state mutations...
    if (this.legacyPluginRegistrationCacheBustingRequired === false) { return; }

    // ensure we get a fresh templateCompilerModuleInstance per ember-addon
    // instance NOTE: this is a quick hack, and will only work as long as
    // templateCompilerPath is a single file bundle
    //
    // (╯°□°）╯︵ ɹǝqɯǝ
    //
    // we will also fix this in ember for future releases

    // Module will be cached in .parent.children as well. So deleting from require.cache alone is not sufficient.
    let mod = require.cache[templateCompilerPath];
    if (mod && mod.parent) {
      let index = mod.parent.children.indexOf(mod);
      if (index >= 0) {
        mod.parent.children.splice(index, 1);
      } else {
        throw new TypeError(`ember-cli-htmlbars attempted to purge '${templateCompilerPath}' but something went wrong.`);
      }
    }

    delete require.cache[templateCompilerPath];
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
        let TemplateCompiler = require('./index');
        return new TemplateCompiler(tree, htmlbarsOptions);
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
    if (this._htmlbarsOptions && this.legacyPluginRegistrationCacheBustingRequired === false) {
      return this._htmlbarsOptions;
    }

    let projectConfig = this.projectConfig() || {};
    let EmberENV = projectConfig.EmberENV || {};
    let templateCompilerPath = this.templateCompilerPath();
    let pluginInfo = this.astPlugins();

    this.purgeModule(templateCompilerPath);

    // do a full clone of the EmberENV (it is guaranteed to be structured
    // cloneable) to prevent ember-template-compiler.js from mutating the
    // shared global config (the cloning can be removed after we drop support
    // for Ember < 3.2).
    let clonedEmberENV = JSON.parse(JSON.stringify(EmberENV));
    global.EmberENV = clonedEmberENV; // Needed for eval time feature flag checks


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

    if (this.legacyPluginRegistrationCacheBustingRequired !== false) {
      let plugins = pluginInfo.plugins;

      if (plugins) {
        for (let type in plugins) {
          for (let i = 0, l = plugins[type].length; i < l; i++) {
            htmlbarsOptions.templateCompiler.registerPlugin(type, plugins[type][i]);
          }
        }
      }
    }

    this.purgeModule(templateCompilerPath);

    delete global.Ember;
    delete global.EmberENV;

    return this._htmlbarsOptions = htmlbarsOptions;
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
        this.ui.writeDeprecateLine('ember-cli-htmlbars is opting out of caching due to an AST plugin that does not provide a caching strategy: `' + wrapper.name + '`.');
        cacheKeys.push((new Date()).getTime() + '|' + Math.random());
      }
    }

    return {
      plugins: plugins,
      cacheKeys: cacheKeys
    };
  }
};
