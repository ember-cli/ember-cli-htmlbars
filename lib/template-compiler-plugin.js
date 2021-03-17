'use strict';

const path = require('path');
const utils = require('./utils');
const Filter = require('broccoli-persistent-filter');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');
const stripBom = require('strip-bom');

function rethrowBuildError(error) {
  if (!error) {
    throw new Error('Unknown Error');
  }

  if (typeof error === 'string') {
    throw new Error('[string exception]: ' + error);
  } else {
    // augment with location and type information and re-throw.
    error.type = 'Template Compiler Error';
    error.location = error.location && error.location.start;

    throw error;
  }
}

class TemplateCompiler extends Filter {
  constructor(inputTree, _options, requiresModuleApiPolyfill = true) {
    let options = _options || {};

    if (!('persist' in options)) {
      options.persist = true;
    }

    super(inputTree, options);

    this.options = options;
    this.inputTree = inputTree;
    this.requiresModuleApiPolyfill = requiresModuleApiPolyfill;

    // TODO: do we need this?
    this.precompile = this.options.templateCompiler.precompile;

    let { templateCompiler, EmberENV } = options;

    utils.initializeEmberENV(templateCompiler, EmberENV);
  }

  baseDir() {
    return __dirname;
  }

  processString(string, relativePath) {
    let srcDir = this.inputPaths[0];
    let srcName = path.join(srcDir, relativePath);

    try {
      // we have to reverse these for reasons that are a bit bonkers. the initial
      // version of this system used `registeredPlugin` from
      // `ember-template-compiler.js` to set up these plugins (because Ember ~ 1.13
      // only had `registerPlugin`, and there was no way to pass plugins directly
      // to the call to `compile`/`precompile`). calling `registerPlugin`
      // unfortunately **inverted** the order of plugins (it essentially did
      // `PLUGINS = [plugin, ...PLUGINS]`).
      //
      // sooooooo...... we are forced to maintain that **absolutely bonkers** ordering
      let astPlugins = this.options.plugins ? [...this.options.plugins.ast].reverse() : [];

      let precompiled = this.options.templateCompiler.precompile(stripBom(string), {
        contents: string,
        isProduction: this.options.isProduction,
        moduleName: relativePath,
        parseOptions: {
          srcName: srcName,
        },

        // intentionally not using `plugins: this.options.plugins` here
        // because if we do, Ember will mutate the shared plugins object (adding
        // all of the built in AST transforms into plugins.ast, which breaks
        // persistent caching)
        plugins: {
          ast: astPlugins,
        },
      });

      if (this.options.dependencyInvalidation) {
        let plugins = pluginsWithDependencies(this.options.plugins.ast);
        let dependencies = [];
        for (let i = 0; i < plugins.length; i++) {
          let pluginDeps = plugins[i].getDependencies(relativePath);
          dependencies = dependencies.concat(pluginDeps);
        }
        this.dependencies.setDependencies(relativePath, dependencies);
      }

      if (this.requiresModuleApiPolyfill) {
        return `export default Ember.HTMLBars.template(${precompiled});`;
      } else {
        return `import { createTemplateFactory } from '@ember/template-factory';\n\nexport default createTemplateFactory(${precompiled});`;
      }
    } catch (error) {
      rethrowBuildError(error);
    }
  }

  _buildOptionsForHash() {
    let strippedOptions = {};

    for (let key in this.options) {
      if (key !== 'templateCompiler') {
        strippedOptions[key] = this.options[key];
      }
    }

    strippedOptions._requiresModuleApiPolyfill = this.requiresModuleApiPolyfill;

    return strippedOptions;
  }

  optionsHash() {
    if (!this._optionsHash) {
      let templateCompilerCacheKey = utils.getTemplateCompilerCacheKey(
        this.options.templateCompilerPath
      );

      this._optionsHash = crypto
        .createHash('md5')
        .update(stringify(this._buildOptionsForHash()), 'utf8')
        .update(templateCompilerCacheKey, 'utf8')
        .digest('hex');
    }

    return this._optionsHash;
  }

  cacheKeyProcessString(string, relativePath) {
    return (
      this.optionsHash() + Filter.prototype.cacheKeyProcessString.call(this, string, relativePath)
    );
  }
}

TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';

function pluginsWithDependencies(registeredPlugins) {
  let found = [];
  for (let i = 0; i < registeredPlugins.length; i++) {
    if (registeredPlugins[i].getDependencies) {
      found.push(registeredPlugins[i]);
    }
  }
  return found;
}

module.exports = TemplateCompiler;
