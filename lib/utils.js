'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const hashForDep = require('hash-for-dep');
const debugGenerator = require('heimdalljs-logger');
const logger = debugGenerator('ember-cli-htmlbars:utils');
const addDependencyTracker = require('./addDependencyTracker');
const vm = require('vm');

const TemplateCompilerCache = new Map();

const INLINE_PRECOMPILE_MODULES = Object.freeze({
  'ember-cli-htmlbars': 'hbs',
  'ember-cli-htmlbars-inline-precompile': 'default',
  'htmlbars-inline-precompile': 'default',
  '@ember/template-compilation': {
    export: 'precompileTemplate',
    disableTemplateLiteral: true,
    shouldParseScope: true,
  },
});

function isInlinePrecompileBabelPluginRegistered(plugins) {
  return plugins.some((plugin) => {
    if (Array.isArray(plugin)) {
      let [pluginPathOrInstance, options, key] = plugin;
      let isHTMLBarsInlinePrecompile =
        pluginPathOrInstance === require.resolve('babel-plugin-htmlbars-inline-precompile') &&
        typeof options.modules === 'object' &&
        options.modules['ember-cli-htmlbars'] === 'hbs';

      let isEmberTemplateCompilation =
        pluginPathOrInstance === require.resolve('babel-plugin-ember-template-compilation') &&
        key === 'ember-cli-htmlbars:inline-precompile';

      return isHTMLBarsInlinePrecompile || isEmberTemplateCompilation;
    } else if (
      plugin !== null &&
      typeof plugin === 'object' &&
      plugin._parallelBabel !== undefined
    ) {
      return plugin._parallelBabel.requireFile === require.resolve('./require-from-worker');
    } else {
      return false;
    }
  });
}

function isColocatedBabelPluginRegistered(plugins) {
  return plugins.some((plugin) => {
    let path = Array.isArray(plugin) ? plugin[0] : plugin;

    return typeof path === 'string' && path === require.resolve('./colocated-babel-plugin');
  });
}

function buildParalleizedBabelPlugin(
  pluginInfo,
  projectConfig,
  templateCompilerPath,
  isProduction,
  requiresModuleApiPolyfill
) {
  let parallelBabelInfo = {
    requireFile: require.resolve('./require-from-worker'),
    buildUsing: 'build',
    params: {
      templateCompilerPath,
      isProduction,
      projectConfig,
      parallelConfigs: pluginInfo.parallelConfigs,
      requiresModuleApiPolyfill,
    },
  };

  // parallelBabelInfo will not be used in the cache unless it is explicitly included
  let cacheKey;
  return {
    _parallelBabel: parallelBabelInfo,
    baseDir: () => __dirname,
    cacheKey: () => {
      if (cacheKey === undefined) {
        cacheKey = makeCacheKey(
          templateCompilerPath,
          pluginInfo,
          JSON.stringify(parallelBabelInfo)
        );
      }
      return cacheKey;
    },
  };
}

function buildOptions(projectConfig, templateCompilerPath, pluginInfo) {
  let EmberENV = projectConfig.EmberENV || {};

  let htmlbarsOptions = {
    isHTMLBars: true,
    EmberENV: EmberENV,
    templateCompiler: getTemplateCompiler(templateCompilerPath, EmberENV),
    templateCompilerPath: templateCompilerPath,

    pluginNames: pluginInfo.pluginNames,
    plugins: {
      ast: pluginInfo.plugins,
    },

    dependencyInvalidation: pluginInfo.dependencyInvalidation,

    pluginCacheKey: pluginInfo.cacheKeys,
  };

  return htmlbarsOptions;
}

const hasGlobalThis = (function () {
  try {
    let context = vm.createContext();

    // we must create a sandboxed context to test if `globalThis` will be
    // present _within_ it because in some contexts a globalThis polyfill has
    // been evaluated. In that case globalThis would be available on the
    // current global context but **would not** be inherited to the global
    // contexts created by `vm.createContext`
    let type = vm.runInContext(`typeof globalThis`, context);

    return type !== 'undefined';
  } catch (e) {
    return false;
  }
})();

function getTemplateCompiler(templateCompilerPath, EmberENV = {}) {
  let templateCompilerFullPath = require.resolve(templateCompilerPath);
  let cacheData = TemplateCompilerCache.get(templateCompilerFullPath);

  if (cacheData === undefined) {
    let templateCompilerContents = fs.readFileSync(templateCompilerFullPath);
    let templateCompilerCacheKey = crypto
      .createHash('md5')
      .update(templateCompilerContents)
      .digest('hex');

    cacheData = {
      script: new vm.Script(templateCompilerContents.toString(), {
        filename: templateCompilerPath,
      }),

      templateCompilerCacheKey,
    };

    TemplateCompilerCache.set(templateCompilerFullPath, cacheData);
  }

  let { script } = cacheData;

  // do a full clone of the EmberENV (it is guaranteed to be structured
  // cloneable) to prevent ember-template-compiler.js from mutating
  // the shared global config
  let clonedEmberENV = JSON.parse(JSON.stringify(EmberENV));

  let sandbox = {
    EmberENV: clonedEmberENV,
    console,

    // Older versions of ember-template-compiler (up until ember-source@3.1.0)
    // eagerly access `setTimeout` without checking via `typeof` first
    setTimeout,
    clearTimeout,

    // fake the module into thinking we are running inside a Node context
    module: { require, exports: {} },
    require,
  };

  // if we are running on a Node version _without_ a globalThis
  // we must provide a `global`
  //
  // this is due to https://git.io/Jtb7s (Ember 3.27+)
  if (!hasGlobalThis) {
    sandbox.global = sandbox;
  }

  let context = vm.createContext(sandbox);

  script.runInContext(context);

  return context.module.exports;
}

function setup(pluginInfo, options) {
  let projectConfig = options.projectConfig || {};
  let templateCompilerPath = options.templateCompilerPath;

  let htmlbarsOptions = buildOptions(projectConfig, templateCompilerPath, pluginInfo);
  let { templateCompiler } = htmlbarsOptions;
  if (options.requiresModuleApiPolyfill) {
    let templatePrecompile = templateCompiler.precompile;

    let precompile = (template, _options) => {
      // we have to reverse these for reasons that are a bit bonkers. the initial
      // version of this system used `registeredPlugin` from
      // `ember-template-compiler.js` to set up these plugins (because Ember ~ 1.13
      // only had `registerPlugin`, and there was no way to pass plugins directly
      // to the call to `compile`/`precompile`). calling `registerPlugin`
      // unfortunately **inverted** the order of plugins (it essentially did
      // `PLUGINS = [plugin, ...PLUGINS]`).
      //
      // sooooooo...... we are forced to maintain that **absolutely bonkers** ordering
      let astPlugins = [...pluginInfo.plugins].reverse();

      let options = {
        plugins: {
          ast: astPlugins,
        },

        ..._options,
      };

      return templatePrecompile(template, options);
    };

    precompile.baseDir = () => path.resolve(__dirname, '..');

    let cacheKey;
    precompile.cacheKey = () => {
      if (cacheKey === undefined) {
        cacheKey = makeCacheKey(templateCompilerPath, pluginInfo);
      }
      cacheKey;
    };

    return [
      require.resolve('babel-plugin-htmlbars-inline-precompile'),
      {
        precompile,
        isProduction: options.isProduction,
        ensureModuleApiPolyfill: options.requiresModuleApiPolyfill,
        modules: INLINE_PRECOMPILE_MODULES,
      },
      'ember-cli-htmlbars:inline-precompile',
    ];
  } else {
    return [
      require.resolve('babel-plugin-ember-template-compilation'),
      {
        // As above, we present the AST transforms in reverse order
        transforms: [...pluginInfo.plugins].reverse(),
        compilerPath: require.resolve(templateCompilerPath),
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
      },
      'ember-cli-htmlbars:inline-precompile',
    ];
  }
}

function getTemplateCompilerCacheKey(templateCompilerPath) {
  let templateCompilerFullPath = require.resolve(templateCompilerPath);
  let cacheData = TemplateCompilerCache.get(templateCompilerFullPath);

  if (cacheData === undefined) {
    getTemplateCompiler(templateCompilerFullPath);
    cacheData = TemplateCompilerCache.get(templateCompilerFullPath);
  }

  return cacheData.templateCompilerCacheKey;
}

function makeCacheKey(templateCompilerPath, pluginInfo, extra) {
  let templateCompilerCacheKey = getTemplateCompilerCacheKey(templateCompilerPath);
  let cacheItems = [templateCompilerCacheKey, extra].concat(pluginInfo.cacheKeys.sort());

  // extra may be undefined
  return cacheItems.filter(Boolean).join('|');
}

function setupPlugins(wrappers) {
  let plugins = [];
  let cacheKeys = [];
  let pluginNames = [];
  let parallelConfigs = [];
  let unparallelizableWrappers = [];
  let dependencyInvalidation = false;
  let canParallelize = true;

  for (let i = 0; i < wrappers.length; i++) {
    let wrapper = wrappers[i];

    if (wrapper.requireFile) {
      const plugin = require(wrapper.requireFile);
      wrapper = plugin[wrapper.buildUsing](wrapper.params);
    }

    pluginNames.push(wrapper.name ? wrapper.name : 'unknown plugin');

    if (wrapper.parallelBabel) {
      parallelConfigs.push(wrapper.parallelBabel);
    } else {
      unparallelizableWrappers.push(wrapper.name);
      canParallelize = false;
    }

    dependencyInvalidation = dependencyInvalidation || wrapper.dependencyInvalidation;
    plugins.push(addDependencyTracker(wrapper.plugin, wrapper.dependencyInvalidation));

    let providesBaseDir = typeof wrapper.baseDir === 'function';
    let augmentsCacheKey = typeof wrapper.cacheKey === 'function';

    // TODO: investigate if `wrapper.dependencyInvalidation` should actually prevent the warning
    if (providesBaseDir || augmentsCacheKey || wrapper.dependencyInvalidation) {
      if (providesBaseDir) {
        let pluginHashForDep = hashForDep(wrapper.baseDir());
        cacheKeys.push(pluginHashForDep);
      }
      if (augmentsCacheKey) {
        cacheKeys.push(wrapper.cacheKey());
      }
    } else {
      logger.debug(
        'ember-cli-htmlbars is opting out of caching due to an AST plugin that does not provide a caching strategy: `' +
          wrapper.name +
          '`.'
      );
      cacheKeys.push(new Date().getTime() + '|' + Math.random());
    }
  }

  return {
    plugins,
    pluginNames,
    cacheKeys,
    parallelConfigs,
    canParallelize,
    unparallelizableWrappers,
    dependencyInvalidation: !!dependencyInvalidation,
  };
}

module.exports = {
  buildOptions,
  setup,
  setupPlugins,
  isColocatedBabelPluginRegistered,
  isInlinePrecompileBabelPluginRegistered,
  buildParalleizedBabelPlugin,
};
