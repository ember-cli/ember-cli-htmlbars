'use strict';

const fs = require('fs');
const broccoli = require('broccoli');
const assert = require('assert');
const TemplateCompiler = require('../index');
const co = require('co');

describe('TemplateCompiler', function(){
  this.timeout(50000);
  const sourcePath = 'test/fixtures';
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
      templateCompiler: require('../bower_components/ember/ember-template-compiler')
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

    assert.equal(actual,expected,'They dont match!');
  }));

  it('ignores utf-8 byte order marks', co.wrap(function*() {
    let tree = new TemplateCompiler(sourcePath, htmlbarsOptions);

    builder = new broccoli.Builder(tree);
    let results = yield builder.build();

    let actual = fs.readFileSync(results.directory + '/template-with-bom.js', { encoding: 'utf8'});
    let source = fs.readFileSync(sourcePath + '/template.hbs', { encoding: 'utf8' });
    let expected = 'export default Ember.HTMLBars.template(' + htmlbarsPrecompile(source, { moduleName: 'template-with-bom.hbs' }) + ');';

    assert.equal(actual,expected,'They dont match!');
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

    assert.equal(actual,expected,'They dont match!');
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

    assert.equal(actual,expected,'They dont match!');
  }));

  it('does not register custom component manager ast transform if flag is disabled', function() {
    var options = {
      templateCompiler: require('../bower_components/ember/ember-template-compiler'),
      EmberENV:{
        FEATURES: { }
      }
    };

    var templateCompiler = new TemplateCompiler(sourcePath, options);

    assert.equal(templateCompiler.options.plugins.ast.length, 0, 'custom ast trasform was not registered');
  });

  it('registers custom component manager ast transform if flag is enabled', function() {
    var options = {
      templateCompiler: require('../bower_components/ember/ember-template-compiler'),
      EmberENV:{
        FEATURES: {
          'glimmer-custom-component-manager': true
        }
      }
    };

    var templateCompiler = new TemplateCompiler(sourcePath, options);

    assert.equal(templateCompiler.options.plugins.ast.length, 1, 'custom ast trasform was registered');
  });

  it('sets custom component manager id on a template\'s metadata if feature flag is enabled', function() {
    var options = {
      templateCompiler: require('../bower_components/ember/ember-template-compiler'),
      EmberENV:{
        FEATURES: {
          'glimmer-custom-component-manager': true
        }
      }
    };
    var templateContent = '{{use-component-manager "glimmer"}}hello';

    var templateCompiler = new TemplateCompiler(sourcePath, options);
    var compiled = JSON.parse(templateCompiler.precompile(templateContent, {
      moduleName: '',
      plugins: templateCompiler.options.plugins
    }));

    assert.equal(compiled.meta.managerId, 'glimmer');
  });
});
