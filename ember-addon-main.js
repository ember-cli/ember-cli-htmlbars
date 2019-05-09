'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');
const addDependencyTracker = require("./addDependencyTracker");
const hashForDep = require('hash-for-dep');
const walkSync = require('walk-sync');
const Plugin = require('broccoli-plugin');

class ColocatedTemplateProcessor extends Plugin {
  constructor(tree, options) {
    super([tree], options);

    this.options = options;
  }

  build() {
    // TODO: do we need to pass through all files, or only template files?
    let files = walkSync(this.inputPaths[0], { directories: false });

    let filesToCopy = [];
    files.forEach(filePath => {
      let filePathParts = path.parse(filePath);
      let inputPath = path.join(this.inputPaths[0], filePath);
      let isInsideComponentsFolder = filePath.includes('/components/');

      // copy forward non-hbs files
      // TODO: don't copy .js files that will ultimately be overridden
      if (!isInsideComponentsFolder || filePathParts.ext !== '.hbs') {
        filesToCopy.push(filePath);
        return;
      }

      // TODO: deal with alternate extensions (e.g. ts)
      let possibleJSPath = path.join(filePathParts.dir, filePathParts.name + '.js');
      let hasJSFile = fs.existsSync(path.join(this.inputPaths[0], possibleJSPath));

      if (filePathParts.name === 'template') {
        // TODO: maybe warn?
        return;
      }

      let templateContents = fs.readFileSync(inputPath, { encoding: 'utf8' });
      let jsContents = null;

      // TODO: deal with hygiene
      if (hasJSFile) {
        // add the template, call setComponentTemplate

        jsContents = fs.readFileSync(path.join(this.inputPaths[0], possibleJSPath), { encoding: 'utf8' });
        jsContents = `${jsContents.replace('export default', 'const CLASS =')}\n;
const setComponentTemplate = Ember._setComponentTemplate;
const TEMPLATE = ${this.options.precompile(templateContents)};
export default setComponentTemplate(TEMPLATE, CLASS);`;
      } else {
        // create JS file, use null component pattern
        jsContents = `import templateOnlyComponent from "@ember/component/template-only";
const setComponentTemplate = Ember._setComponentTemplate;
const TEMPLATE = ${this.options.precompile(templateContents)};
const CLASS = templateOnlyComponent();
export default setComponentTemplate(TEMPLATE, CLASS);`;
      }


      let outputPath = path.join(this.outputPath, possibleJSPath);

      // TODO: check for compat with Node 8 (recursive may only be present in 10+)
      // TODO: don't speculatively mkdirSync (likely do in a try/catch with ENOENT)
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      fs.writeFileSync(outputPath, jsContents, { encoding: 'utf8' });
    });

    filesToCopy.forEach(filePath => {
      let inputPath = path.join(this.inputPaths[0], filePath);
      let outputPath = path.join(this.outputPath, filePath);

      // avoid copying file over top of a previously written one
      if (fs.existsSync(outputPath)) {
        return;
      }

      // TODO: check for compat with Node 8 (recursive may only be present in 10+)
      // TODO: don't speculatively mkdirSync (likely do in a try/catch with ENOENT)
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.copyFileSync(inputPath, outputPath);
    })
  }
}

module.exports = {
  name: require('./package').name,

  parentRegistry: null,

  purgeModule(templateCompilerPath) {
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

    let precompile = string => {
      let htmlbarsOptions = this.htmlbarsOptions();
      let templateCompiler = htmlbarsOptions.templateCompiler;
      return utils.template(templateCompiler, string);
    }

    registry.add('template', {
      name: 'ember-cli-htmlbars',
      ext: 'hbs',
      _addon: this,
      toTree(tree) {
        let htmlbarsOptions = this._addon.htmlbarsOptions();
        let TemplateCompiler = require('./index');
        let unifiedColocatedTemplates = new ColocatedTemplateProcessor(tree, { precompile });

        return new TemplateCompiler(unifiedColocatedTemplates, htmlbarsOptions);
      },

      precompile,
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
    let projectConfig = this.projectConfig() || {};
    let EmberENV = projectConfig.EmberENV || {};
    let templateCompilerPath = this.templateCompilerPath();

    this.purgeModule(templateCompilerPath);

    // do a full clone of the EmberENV (it is guaranteed to be structured
    // cloneable) to prevent ember-template-compiler.js from mutating
    // the shared global config
    let clonedEmberENV = JSON.parse(JSON.stringify(EmberENV));
    global.EmberENV = clonedEmberENV; // Needed for eval time feature flag checks
    let pluginInfo = this.astPlugins();

    let htmlbarsOptions = {
      isHTMLBars: true,
      EmberENV: EmberENV,
      templateCompiler: require(templateCompilerPath),
      templateCompilerPath: templateCompilerPath,

      plugins: {
        ast: pluginInfo.plugins
      },

      dependencyInvalidation: pluginInfo.dependencyInvalidation,

      pluginCacheKey: pluginInfo.cacheKeys
    };

    this.purgeModule(templateCompilerPath);

    delete global.Ember;
    delete global.EmberENV;

    return htmlbarsOptions;
  },

  astPlugins() {
    let pluginWrappers = this.parentRegistry.load('htmlbars-ast-plugin');
    let plugins = [];
    let cacheKeys = [];
    let dependencyInvalidation = false;

    for (let i = 0; i < pluginWrappers.length; i++) {
      let wrapper = pluginWrappers[i];
      dependencyInvalidation = dependencyInvalidation || wrapper.dependencyInvalidation;
      plugins.push(addDependencyTracker(wrapper.plugin, wrapper.dependencyInvalidation));


      let providesBaseDir = typeof wrapper.baseDir === 'function';
      let augmentsCacheKey = typeof wrapper.cacheKey === 'function';

      if (providesBaseDir || augmentsCacheKey || wrapper.dependencyInvalidation) {
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
      cacheKeys: cacheKeys,
      dependencyInvalidation: dependencyInvalidation,
    };
  }
};
