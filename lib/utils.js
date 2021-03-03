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
});

function isInlinePrecompileBabelPluginRegistered(plugins) {
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
        plugin._parallelBabel.requireFile === require.resolve('./require-from-worker') &&
        typeof plugin._parallelBabel.params === 'object' &&
        typeof plugin._parallelBabel.params.modules === 'object' &&
        plugin._parallelBabel.params.modules['ember-cli-htmlbars'] === 'hbs'
      );
    } else {
      return false;
    }
  });
}

function isColocatedBabelPluginRegistered(plugins) {
  return plugins.some(
    plugin => typeof plugin === 'string' && plugin === require.resolve('./colocated-babel-plugin')
  );
}

function buildParalleizedBabelPlugin(pluginInfo, templateCompilerPath, isProduction) {
  let parallelBabelInfo = {
    requireFile: require.resolve('./require-from-worker'),
    buildUsing: 'build',
    params: {
      templateCompilerPath,
      isProduction,
      parallelConfigs: pluginInfo.parallelConfigs,
      modules: INLINE_PRECOMPILE_MODULES,
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

    plugins: {
      ast: pluginInfo.plugins,
    },

    dependencyInvalidation: pluginInfo.dependencyInvalidation,

    pluginCacheKey: pluginInfo.cacheKeys,
  };

  return htmlbarsOptions;
}

function getTemplateCompiler(templateCompilerPath, EmberENV = {}) {
  let templateCompilerFullPath = require.resolve(templateCompilerPath);
  let cacheData = TemplateCompilerCache.get(templateCompilerFullPath);

  if (cacheData === undefined) {
    let templateCompilerContents = fs.readFileSync(templateCompilerFullPath, { encoding: 'utf-8' });
    let templateCompilerCacheKey = crypto
      .createHash('md5')
      .update(templateCompilerContents)
      .digest('hex');

    cacheData = {
      script: new vm.Script(templateCompilerContents, {
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
  if (typeof globalThis === 'undefined') {
    sandbox.global = sandbox;
  }

  let context = vm.createContext(sandbox);

  script.runInContext(context);

  return context.module.exports;
}

function initializeEmberENV(templateCompiler, EmberENV) {
  if (!templateCompiler || !EmberENV) {
    return;
  }

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
      if (prop === 'FEATURES') {
        return;
      }

      templateCompiler._Ember.ENV[prop] = EmberENV[prop];
    });
  }
}

function template(templateCompiler, string, options) {
  let precompiled = templateCompiler.precompile(string, options);

  return 'Ember.HTMLBars.template(' + precompiled + ')';
}

function setup(pluginInfo, options) {
  let projectConfig = options.projectConfig || {};
  let templateCompilerPath = options.templateCompilerPath;

  let htmlbarsOptions = buildOptions(projectConfig, templateCompilerPath, pluginInfo);
  let { templateCompiler } = htmlbarsOptions;

  let templatePrecompile = templateCompiler.precompile;

  let precompile = (template, options) => {
    let plugins = pluginInfo.plugins || [];
    // concat so we ensure we don't mutate the original plugins
    // reverse to ensure that original AST plugin ordering is preserved
    let astPlugins = [].concat(plugins).reverse();

    options = options || {};
    options.plugins = {
      ast: astPlugins,
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

  let plugin = [
    require.resolve('babel-plugin-htmlbars-inline-precompile'),
    { precompile, isProduction: options.isProduction, modules: INLINE_PRECOMPILE_MODULES },
    'ember-cli-htmlbars:inline-precompile',
  ];

  return plugin;
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
    cacheKeys,
    parallelConfigs,
    canParallelize,
    unparallelizableWrappers,
    dependencyInvalidation: !!dependencyInvalidation,
  };
}

module.exports = {
  buildOptions,
  initializeEmberENV,
  template,
  setup,
  makeCacheKey,
  setupPlugins,
  isColocatedBabelPluginRegistered,
  isInlinePrecompileBabelPluginRegistered,
  buildParalleizedBabelPlugin,
  getTemplateCompiler,
  getTemplateCompilerCacheKey,
};
