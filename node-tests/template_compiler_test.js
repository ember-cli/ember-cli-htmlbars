'use strict';

const assert = require('assert');
const TemplateCompiler = require('../lib/template-compiler-plugin');
const co = require('co');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const fixturify = require('fixturify');
const { stripIndent } = require('common-tags');

describe('TemplateCompiler', function () {
  this.timeout(10000);

  let input, output, builder;

  beforeEach(
    co.wrap(function* () {
      input = yield createTempDir();
      input.write(fixturify.readSync(`${__dirname}/fixtures`));
    })
  );

  afterEach(
    co.wrap(function* () {
      if (builder) {
        builder.cleanup();
      }

      yield input.dispose();

      if (output) {
        yield output.dispose();
      }
    })
  );

  let htmlbarsOptions, htmlbarsPrecompile;

  beforeEach(function () {
    htmlbarsOptions = {
      isHTMLBars: true,
      plugins: {
        ast: [],
      },
      templateCompiler: require('ember-source/dist/ember-template-compiler.js'),
      templateCompilerPath: require.resolve('ember-source/dist/ember-template-compiler.js'),
    };

    htmlbarsPrecompile = htmlbarsOptions.templateCompiler.precompile;
  });

  describe('requiresModuleApiPolyfill: true', function () {
    it(
      'precompiles templates into htmlbars',
      co.wrap(function* () {
        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('template.hbs');
        let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, {
          moduleName: 'template.hbs',
        })});`;
        assert.strictEqual(output.readText('template.js'), expected);
      })
    );

    it('invokes AST plugins', async function () {
      let source = '{{foo-bar}}';
      input.write({
        'template.hbs': source,
      });
      let plugin = (env) => {
        return {
          name: 'fake-ast-plugin',

          visitor: {
            MustacheStatement() {
              return env.syntax.builders.text('Huzzah!');
            },
          },
        };
      };

      htmlbarsOptions.plugins.ast.push(plugin);

      let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

      output = createBuilder(tree);
      await output.build();

      let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, {
        moduleName: 'template.hbs',
        plugins: {
          ast: [plugin],
        },
      })});`;

      let outputString = output.readText('template.js');
      assert.strictEqual(outputString, expected);
      assert.ok(outputString.includes('Huzzah!'));
    });

    it('AST Plugins have access to `isProduction` status', async function () {
      let source = '{{foo-bar}}';
      input.write({
        'template.hbs': source,
      });

      let wasProduction = false;
      let plugin = (env) => {
        wasProduction = env.isProduction;

        return {
          name: 'fake-ast-plugin',

          visitor: {},
        };
      };

      htmlbarsOptions.isProduction = true;
      htmlbarsOptions.plugins.ast.push(plugin);

      let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

      output = createBuilder(tree);
      await output.build();

      assert.ok(wasProduction);
    });

    it(
      'ignores utf-8 byte order marks',
      co.wrap(function* () {
        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('template.hbs');
        let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, {
          moduleName: 'template-with-bom.hbs',
        })});`;

        assert.strictEqual(output.readText('template-with-bom.js'), expected);
      })
    );

    it(
      'passes FEATURES to compiler when provided as `FEATURES` [DEPRECATED]',
      co.wrap(function* () {
        htmlbarsOptions.FEATURES = {
          'ember-htmlbars-component-generation': true,
        };

        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('web-component-template.hbs');
        let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, {
          moduleName: 'web-component-template.hbs',
        })});`;

        assert.strictEqual(output.readText('web-component-template.js'), expected);
      })
    );

    it(
      'passes FEATURES to compiler when provided as `EmberENV.FEATURES`',
      co.wrap(function* () {
        htmlbarsOptions.EmberENV = {
          FEATURES: {
            'ember-htmlbars-component-generation': true,
          },
        };

        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, true);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('web-component-template.hbs');
        let expected = `export default Ember.HTMLBars.template(${htmlbarsPrecompile(source, {
          moduleName: 'web-component-template.hbs',
        })});`;

        assert.strictEqual(output.readText('web-component-template.js'), expected);
      })
    );
  });

  describe('requiresModuleApiPolyfill: false', function () {
    it(
      'precompiles templates into htmlbars',
      co.wrap(function* () {
        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('template.hbs');
        let expected = stripIndent`
          import { createTemplateFactory } from '@ember/template-factory';

          export default createTemplateFactory(${htmlbarsPrecompile(source, {
            moduleName: 'template.hbs',
          })});
        `;
        assert.strictEqual(output.readText('template.js'), expected);
      })
    );

    it('invokes AST plugins', async function () {
      let source = '{{foo-bar}}';
      input.write({
        'template.hbs': source,
      });
      let plugin = (env) => {
        return {
          name: 'fake-ast-plugin',

          visitor: {
            MustacheStatement() {
              return env.syntax.builders.text('Huzzah!');
            },
          },
        };
      };

      htmlbarsOptions.plugins.ast.push(plugin);

      let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

      output = createBuilder(tree);
      await output.build();

      let expected = stripIndent`
        import { createTemplateFactory } from '@ember/template-factory';

        export default createTemplateFactory(${htmlbarsPrecompile(source, {
          moduleName: 'template.hbs',
          plugins: {
            ast: [plugin],
          },
        })});
      `;

      let outputString = output.readText('template.js');
      assert.strictEqual(outputString, expected);
      assert.ok(outputString.includes('Huzzah!'));
    });

    it('AST Plugins have access to `isProduction` status', async function () {
      let source = '{{foo-bar}}';
      input.write({
        'template.hbs': source,
      });

      let wasProduction = false;
      let plugin = (env) => {
        wasProduction = env.isProduction;

        return {
          name: 'fake-ast-plugin',

          visitor: {},
        };
      };

      htmlbarsOptions.isProduction = true;
      htmlbarsOptions.plugins.ast.push(plugin);

      let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

      output = createBuilder(tree);
      await output.build();

      assert.ok(wasProduction);
    });

    it(
      'ignores utf-8 byte order marks',
      co.wrap(function* () {
        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('template.hbs');
        let expected = stripIndent`
          import { createTemplateFactory } from '@ember/template-factory';

          export default createTemplateFactory(${htmlbarsPrecompile(source, {
            moduleName: 'template-with-bom.hbs',
          })});
        `;

        assert.strictEqual(output.readText('template-with-bom.js'), expected);
      })
    );

    it(
      'passes FEATURES to compiler when provided as `FEATURES` [DEPRECATED]',
      co.wrap(function* () {
        htmlbarsOptions.FEATURES = {
          'ember-htmlbars-component-generation': true,
        };

        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('web-component-template.hbs');
        let expected = stripIndent`
          import { createTemplateFactory } from '@ember/template-factory';

          export default createTemplateFactory(${htmlbarsPrecompile(source, {
            moduleName: 'web-component-template.hbs',
          })});
        `;

        assert.strictEqual(output.readText('web-component-template.js'), expected);
      })
    );

    it(
      'passes FEATURES to compiler when provided as `EmberENV.FEATURES`',
      co.wrap(function* () {
        htmlbarsOptions.EmberENV = {
          FEATURES: {
            'ember-htmlbars-component-generation': true,
          },
        };

        let tree = new TemplateCompiler(input.path(), htmlbarsOptions, false);

        output = createBuilder(tree);
        yield output.build();

        let source = input.readText('web-component-template.hbs');
        let expected = stripIndent`
          import { createTemplateFactory } from '@ember/template-factory';

          export default createTemplateFactory(${htmlbarsPrecompile(source, {
            moduleName: 'web-component-template.hbs',
          })});
        `;

        assert.strictEqual(output.readText('web-component-template.js'), expected);
      })
    );
  });
});
