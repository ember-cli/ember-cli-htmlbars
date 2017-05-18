'use strict';

const fs = require('fs');
const utils = require('./utils');
const Filter = require('broccoli-persistent-filter');
const crypto = require('crypto');
const stringify = require('json-stable-stringify');
const stripBom = require('strip-bom');
const ExtractPragmaAstTransform = require('ember-build-utilities/dist/lib/compilers/glimmer/extract-pragma-ast-transform');

class TemplateCompiler extends Filter {
  constructor(inputTree, _options) {
    let options = _options || {};

    if (!Object.hasOwnProperty(options, 'persist')) {
      options.persist = true;
    }

    super(inputTree, options);

    this.options = options;
    this.options.plugins = this.options.plugins || {};
    this.inputTree = inputTree;

    this.registerPlugin = this.options.templateCompiler.registerPlugin;

    this.initializeFeatures();
    this.registerFeaturedPlugin('glimmer-custom-component-manager', ExtractPragmaAstTransform);
    this.registerPlugins();
  }

  baseDir() {
    return __dirname;
  }

  registerPlugins() {
    let plugins = this.options.plugins;

    if (plugins) {
      for (let type in plugins) {
        for (let i = 0, l = plugins[type].length; i < l; i++) {
          this.registerPlugin(type, plugins[type][i]);
        }
      }
    }
  }

  registerFeaturedPlugin(featureName, plugin) {
    const featureEnabled = !!this.options.templateCompiler._Ember.FEATURES[featureName];

    this.options.plugins.ast = this.options.plugins.ast || [];

    if (featureEnabled) {
      this.options.plugins.ast.push(plugin);
    }
  }

  initializeFeatures() {
    let EmberENV = this.options.EmberENV;
    let FEATURES = this.options.FEATURES;
    let templateCompiler = this.options.templateCompiler;

    if (FEATURES) {
      console.warn('Using `options.FEATURES` with ember-cli-htmlbars is deprecated.  Please provide the full EmberENV as options.EmberENV instead.');
      EmberENV = EmberENV || {};
      EmberENV.FEATURES = FEATURES;
    }

    utils.initializeEmberENV(templateCompiler, EmberENV);
  }

  precompile(string, options) {
    return utils.precompile(this.options.templateCompiler, string, options);
  }

  processString(string, relativePath) {
    const precompiledTemplate = this.precompile(stripBom(string), {
      moduleName: relativePath,
      plugins: this.options.plugins
    });

    return `export default Ember.HTMLBars.template(${precompiledTemplate});`;
  }

  _buildOptionsForHash() {
    let strippedOptions = {};

    for (let key in this.options) {
      if (key !== 'templateCompiler') {
        strippedOptions[key] = this.options[key];
      }
    }

    return strippedOptions;
  }

  _templateCompilerContents() {
    if (this.options.templateCompilerPath) {
      return fs.readFileSync(this.options.templateCompilerPath, { encoding: 'utf8' });
    } else {
      return '';
    }
  }

  optionsHash() {
    if (!this._optionsHash) {
      this._optionsHash = crypto.createHash('md5')
        .update(stringify(this._buildOptionsForHash()), 'utf8')
        .update(stringify(this._templateCompilerContents()), 'utf8')
        .digest('hex');
    }

    return this._optionsHash;
  }

  cacheKeyProcessString(string, relativePath) {
    return this.optionsHash() + Filter.prototype.cacheKeyProcessString.call(this, string, relativePath);
  }
}

TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';

module.exports = TemplateCompiler;
