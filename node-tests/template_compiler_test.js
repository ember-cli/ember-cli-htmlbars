'use strict';

const assert = require('assert');
const TemplateCompiler = require('../index');
const co = require('co');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const fixturify = require('fixturify');
const MergeTrees = require('broccoli-merge-trees');

describe('TemplateCompiler', function(){
  this.timeout(10000);

  let input, output, builder;

  function buildHTMLBarsOptions(plugins) {
    return {
      plugins,
      isHTMLBars: true,
      templateCompiler: require('ember-source/dist/ember-template-compiler.js'),
    };
  }

  beforeEach(co.wrap(function*() {
    input = yield createTempDir();
    input.write(fixturify.readSync(`${__dirname}/fixtures`));
  }));

  afterEach(co.wrap(function*() {
    if (builder) {
      builder.cleanup();
    }

    yield input.dispose();

    if (output) {
      yield output.dispose();
    }
  }));

  let htmlbarsOptions, htmlbarsPrecompile;

  beforeEach(function() {
    htmlbarsOptions = buildHTMLBarsOptions();
    htmlbarsPrecompile = htmlbarsOptions.templateCompiler.precompile;
  });

  it('precompiles templates into htmlbars', co.wrap(function* () {
    let tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();

    let source = input.readText('template.hbs');
    let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, { moduleName: 'template.hbs' })});`;
    assert.strictEqual(output.readText('template.js'), expected);
  }));

  it('ignores utf-8 byte order marks', co.wrap(function*() {
    let tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();

    let source = input.readText('template.hbs');
    let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, { moduleName: 'template-with-bom.hbs' })});`;

    assert.strictEqual(output.readText('template-with-bom.js'), expected);
  }));

  it('passes FEATURES to compiler when provided as `FEATURES` [DEPRECATED]', co.wrap(function* () {
    htmlbarsOptions.FEATURES = {
      'ember-htmlbars-component-generation': true
    };

    let tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();

    let source = input.readText('web-component-template.hbs');
    let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, { moduleName: 'web-component-template.hbs' })});`;

    assert.strictEqual(output.readText('web-component-template.js'), expected);
  }));

  it('passes FEATURES to compiler when provided as `EmberENV.FEATURES`', co.wrap(function* () {
    htmlbarsOptions.EmberENV = {
      FEATURES: {
        'ember-htmlbars-component-generation': true
      }
    };

    let tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();

    let source = input.readText('web-component-template.hbs');
    let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, { moduleName: 'web-component-template.hbs' })});`;

    assert.strictEqual(output.readText('web-component-template.js'), expected);
  }));

  describe('multiple instances', function() {
    let first, second;

    beforeEach(co.wrap(function*() {
      first = yield createTempDir();
      second = yield createTempDir();
    }));

    it('allows each instance to have separate AST plugins', co.wrap(function*() {
      first.write({
        'first': {
          'foo.hbs': `LOLOL`,
        }
      });

      second.write({
        'second': {
          'bar.hbs': `LOLOL`,
        }
      });

      class SillyPlugin {
        constructor(syntax) {
          this.syntax = syntax;
        }

        transform(ast) {
          this.syntax.traverse(ast, {
            TextNode(node) {
              node.chars = 'NOT FUNNY!';
            }
          });

          return ast;
        }
      }

      let firstTree = new TemplateCompiler(first.path(), buildHTMLBarsOptions({
        ast: [SillyPlugin],
      }));
      let secondTree = new TemplateCompiler(second.path(), buildHTMLBarsOptions());

      output = createBuilder(new MergeTrees([firstTree, secondTree]));
      yield output.build();

      assert.ok(output.readText('first/foo.js').includes('NOT FUNNY'), 'first was transformed');
      assert.ok(output.readText('second/bar.js').includes('LOLOL'), 'second was not transformed');
    }));
  });
});
