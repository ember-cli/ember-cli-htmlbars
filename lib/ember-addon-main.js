'use strict';

const path = require('path');
const SilentError = require('silent-error');
const utils = require('./utils');
const VersionChecker = require('ember-cli-version-checker');

let registryInvocationCounter = 0;

module.exports = {
  name: require('../package').name,

  parentRegistry: null,

  init() {
    this._super.init.apply(this, arguments);

    let parentName = typeof this.parent.name === 'function' ? this.parent.name() : this.parent.name;

    this.logger = require('heimdalljs-logger')('ember-cli-htmlbars:addon:' + parentName);
  },

  _shouldColocateTemplates() {
    if (this._cachedShouldColocateTemplates) {
      return this._cachedShouldColocateTemplates;
    }

    const semver = require('semver');

    let babel = this.parent.addons.find((a) => a.name === 'ember-cli-babel');
    let hasBabel = babel !== undefined;
    let babelVersion = hasBabel && babel.pkg.version;

    let ember = this.project.addons.find((a) => a.name === 'ember-source');
    let hasEmberSource = ember !== undefined;
    let emberVersion = hasEmberSource && ember.pkg.version;

    // using this.project.emberCLIVersion() allows us to avoid issues when `npm
    // link` is used; if this addon were linked and we did something like
    // `require('ember-cli/package').version` we would get our own ember-cli
    // version **not** the one in use currently
    let emberCLIVersion = this.project.emberCLIVersion();

    let hasValidBabelVersion = hasBabel && semver.gte(babelVersion, '7.11.0');
    let hasValidEmberCLIVersion = semver.gte(emberCLIVersion, '3.12.0-beta.2');

    // once a polyfill is written, we will need to update this logic to check
    // for _either_ `ember-source@3.13` or the polyfill
    let hasValidEmberVersion = hasEmberSource && semver.gte(emberVersion, '3.13.0');

    this._cachedShouldColocateTemplates =
      hasValidEmberVersion && hasValidBabelVersion && hasValidEmberCLIVersion;

    this.logger.info(
      `Colocation processing: ${this._cachedShouldColocateTemplates} (hasValidEmberVersion: ${hasValidEmberVersion} hasValidEmberCLIVersion: ${hasValidEmberCLIVersion}; hasValidBabelVersion: ${hasValidBabelVersion};`
    );

    return this._cachedShouldColocateTemplates;
  },

  transpileTree(inputTree) {
    const TemplateCompiler = require('./template-compiler-plugin');
    return new TemplateCompiler(inputTree);
  },

  setupPreprocessorRegistry(type, registry) {
    // ensure that broccoli-ember-hbs-template-compiler is not processing hbs files
    registry.remove('template', 'broccoli-ember-hbs-template-compiler');

    let isProduction = process.env.EMBER_ENV === 'production';

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

        let inputTree = debugTree(tree, '01-input');

        if (shouldColocateTemplates) {
          const ColocatedTemplateProcessor = require('./colocated-broccoli-plugin');

          inputTree = debugTree(new ColocatedTemplateProcessor(inputTree), '02-colocated-output');
        }

        let output = debugTree(this._addon.transpileTree(inputTree), '03-output');

        let checker = new VersionChecker(this._addon.project).for('ember-cli', 'npm');
        let requiresBabelTree = checker.lt('3.13.0');
        let isAddon = this._addon.parent !== this._addon.project;

        // as a result of https://github.com/ember-cli/ember-cli-htmlbars/pull/749 we are relying
        // on babel for all template comilation. This works fine since ember-cli@3.13 but before
        // that there was a different path for **addon** templates and they would not be compiled
        // correctly. This change wraps the output of addons in a babel tree since ember-cli
        // isn't doing that properly.
        if (requiresBabelTree && isAddon) {
          let babelAddon = this._addon.parent.addons.find(
            (addon) => addon.name === 'ember-cli-babel'
          );
          output = babelAddon.transpileTree(output, {
            babel: this._addon.parent.options.babel,
            'ember-cli-babel': {
              compileModules: false,
            },
          });
        }

        return output;
      },

      precompile(string, _options) {
        let options = _options;
        let htmlbarsOptions = this._addon.htmlbarsOptions();
        let templateCompiler = htmlbarsOptions.templateCompiler;

        if (isProduction) {
          options = Object.assign({ isProduction }, _options);
        }

        return utils.template(templateCompiler, string, options);
      },
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }

    let legacyInlinePrecompileAddon = this.parent.addons.find(
      (a) => a.name === 'ember-cli-htmlbars-inline-precompile'
    );
    if (legacyInlinePrecompileAddon !== undefined) {
      let heirarchy = [];
      let pointer = legacyInlinePrecompileAddon;
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
      legacyInlinePrecompileAddon.included = function () {};
    }
  },

  included() {
    this._super.included.apply(this, arguments);

    let addonOptions = this._getAddonOptions();
    addonOptions.babel = addonOptions.babel || {};
    addonOptions.babel.plugins = addonOptions.babel.plugins || [];
    let babelPlugins = addonOptions.babel.plugins;

    let isProduction = process.env.EMBER_ENV === 'production';

    let checker = new VersionChecker(this.project).for('ember-source', 'npm');
    this._requiresModuleApiPolyfill = checker.exists() && checker.lt('3.27.0-alpha.1');

    // add the babel-plugin-htmlbars-inline-precompile to the list of plugins
    // used by `ember-cli-babel` addon
    if (!utils.isInlinePrecompileBabelPluginRegistered(babelPlugins)) {
      let pluginInfo = this.astPlugins();
      let templateCompilerPath = this.templateCompilerPath();

      if (pluginInfo.canParallelize) {
        this.logger.debug(
          `using babel inline precompilation plugin (parallelized) with ${pluginInfo.pluginNames}`
        );

        let htmlbarsInlinePrecompilePlugin = utils.buildParalleizedBabelPlugin(
          pluginInfo,
          this.projectConfig(),
          templateCompilerPath,
          isProduction,
          this._requiresModuleApiPolyfill
        );

        babelPlugins.push(htmlbarsInlinePrecompilePlugin);
      } else {
        this.logger.debug(
          `using babel inline precompilation plugin (NON-parallelized) with ${pluginInfo.pluginNames}`
        );
        this.logger.debug('Prevented by these plugins: ' + pluginInfo.unparallelizableWrappers);

        let htmlBarsPlugin = utils.setup(pluginInfo, {
          isProduction,
          projectConfig: this.projectConfig(),
          templateCompilerPath,
          requiresModuleApiPolyfill: this._requiresModuleApiPolyfill,
        });

        babelPlugins.push(htmlBarsPlugin);
      }
    }

    if (this._shouldColocateTemplates() && !utils.isColocatedBabelPluginRegistered(babelPlugins)) {
      babelPlugins.push([
        require.resolve('./colocated-babel-plugin'),
        { requiresModuleApiPolyfill: this._requiresModuleApiPolyfill },
      ]);
    }
  },

  projectConfig() {
    return this.project.config(process.env.EMBER_ENV);
  },

  _getAddonOptions() {
    return (this.parent && this.parent.options) || (this.app && this.app.options) || {};
  },

  templateCompilerPath() {
    let app = this._findHost();
    let templateCompilerPath =
      app &&
      app.options &&
      app.options['ember-cli-htmlbars'] &&
      app.options['ember-cli-htmlbars'].templateCompilerPath;

    if (templateCompilerPath) {
      return path.resolve(this.project.root, templateCompilerPath);
    }

    let ember = this.project.findAddonByName('ember-source');
    if (!ember) {
      throw new SilentError(
        `ember-cli-htmlbars: Cannot find the ember-source addon as part of the project, please ensure that 'ember-source' is in your projects dependencies or devDependencies`
      );
    }

    return ember.absolutePaths.templateCompiler;
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
