'use strict';

const fs = require('fs');
const broccoli = require('broccoli');
const assert = require('assert');
const TemplateCompiler = require('../index');
const co = require('co');

describe('TemplateCompiler', function(){
  this.timeout(10000);

  const sourcePath = __dirname + '/fixtures';
  let builder;

  afterEach(function() {
    if (builder) {
      builder.cleanup();
    }
  });

  let htmlbarsOptions, htmlbarsPrecompile;

  beforeEach(function() {
    htmlbarsOptions = {
      isHTMLBars: true,
      templateCompiler: require('ember-source/dist/ember-template-compiler.js')
    };

    htmlbarsPrecompile = htmlbarsOptions.templateCompiler.precompile;
  });

  it('precompiles templates into htmlbars', co.wrap(function* () {
    let tree = new TemplateCompiler(sourcePath, htmlbarsOptions);

    builder = new broccoli.Builder(tree);
    let results = yield builder.build();

    let actual = fs.readFileSync(results.directory + '/template.js', { encoding: 'utf8'});
    let source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
    let expected = 'export default Ember.HTMLBars.template(' + htmlbarsPrecompile(source, { moduleName: 'template.hbs' }) + ');';

    assert.strictEqual(actual,expected,'They dont match!');
  }));

  it('ignores utf-8 byte order marks', co.wrap(function*() {
    let tree = new TemplateCompiler(sourcePath, htmlbarsOptions);

    builder = new broccoli.Builder(tree);
    let results = yield builder.build();

    let actual = fs.readFileSync(results.directory + '/template-with-bom.js', { encoding: 'utf8'});
    let source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
    let expected = 'export default Ember.HTMLBars.template(' + htmlbarsPrecompile(source, { moduleName: 'template-with-bom.hbs' }) + ');';

    assert.strictEqual(actual,expected,'They dont match!');
  }));

  it('passes FEATURES to compiler when provided as `FEATURES` [DEPRECATED]', co.wrap(function* () {
    htmlbarsOptions.FEATURES = {
      'ember-htmlbars-component-generation': true
    };

    let tree = new TemplateCompiler(sourcePath, htmlbarsOptions);

    builder = new broccoli.Builder(tree);
    let results = yield builder.build();

    let actual = fs.readFileSync(results.directory + '/web-component-template.js', { encoding: 'utf8'});
    let source = fs.readFileSync(sourcePath + '/web-component-template.hbs', { encoding: 'utf8' });
    let expected = 'export default Ember.HTMLBars.template(' + htmlbarsPrecompile(source, { moduleName: 'web-component-template.hbs' }) + ');';

    assert.strictEqual(actual,expected,'They dont match!');
  }));

  it('passes FEATURES to compiler when provided as `EmberENV.FEATURES`', co.wrap(function* () {
    htmlbarsOptions.EmberENV = {
      FEATURES: {
        'ember-htmlbars-component-generation': true
      }
    };

    let tree = new TemplateCompiler(sourcePath, htmlbarsOptions);

    builder = new broccoli.Builder(tree);
    let results = yield builder.build();

    let actual = fs.readFileSync(results.directory + '/web-component-template.js', { encoding: 'utf8'});
    let source = fs.readFileSync(sourcePath + '/web-component-template.hbs', { encoding: 'utf8' });
    let expected = 'export default Ember.HTMLBars.template(' + htmlbarsPrecompile(source, { moduleName: 'web-component-template.hbs' }) + ');';

    assert.strictEqual(actual,expected,'They dont match!');
  }));
});
