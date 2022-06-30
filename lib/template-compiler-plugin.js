'use strict';

const Filter = require('broccoli-persistent-filter');
const jsStringEscape = require('js-string-escape');

class TemplateCompiler extends Filter {
  constructor(inputTree, options = {}) {
    if (!('persist' in options)) {
      options.persist = true;
    }
    super(inputTree, options);
  }

  baseDir() {
    return __dirname;
  }

  processString(string, relativePath) {
    return [
      `import { hbs } from 'ember-cli-htmlbars';`,
      `export default hbs('${jsStringEscape(string)}', { moduleName: '${jsStringEscape(
        relativePath
      )}' });`,
      '',
    ].join('\n');
  }

  getDestFilePath(relativePath) {
    if (relativePath.endsWith('.hbs')) {
      return relativePath.replace(/\.hbs$/, '.js');
    }
  }
}

TemplateCompiler.prototype.extensions = ['hbs', 'handlebars'];
TemplateCompiler.prototype.targetExtension = 'js';

module.exports = TemplateCompiler;
