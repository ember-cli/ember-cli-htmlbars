/// @ts-check
'use strict';

const path = require('path');
const assert = require('assert');
const fs = require('fs');
const TemplateCompiler = require('../lib/template-compiler-plugin');
const co = require('co');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const fixturify = require('fixturify');
const addDependencyTracker = require('../lib/addDependencyTracker');
const templateCompiler = require('ember-source/dist/ember-template-compiler.js');

describe('AST plugins', function () {
  const they = it;
  this.timeout(10000);

  let input, output, builder, tree, htmlbarsOptions;

  async function clearTreeCache(tree) {
    if (tree && tree.processor.processor._cache) {
      await tree.processor.processor._cache.clear();
    }
  }

  beforeEach(
    co.wrap(function* () {
      rewriterCallCount = 0;
      input = yield createTempDir();
      input.write(fixturify.readSync(`${__dirname}/fixtures`));
      htmlbarsOptions = {
        isHTMLBars: true,
        templateCompiler: templateCompiler,
        templateCompilerPath: require.resolve('ember-source/dist/ember-template-compiler.js'),
      };
    })
  );

  afterEach(
    co.wrap(function* () {
      yield clearTreeCache(tree);

      if (builder) {
        builder.cleanup();
      }

      yield input.dispose();

      if (output) {
        yield output.dispose();
      }
    })
  );

  let rewriterCallCount;
  function DivRewriterImpl(env) {
    let programStackDepth = 0;
    let rewriter = {
      name: 'test-div-rewriter',
      tagNameFile: undefined,
      tagName: 'span',
      resetDependencies() {
        rewriter.tagNameFile = undefined;
        rewriter.tagName = 'span';
      },
      dependencies() {
        return rewriter.tagNameFile ? [rewriter.tagNameFile] : [];
      },
      visitor: {
        Program: {
          enter() {
            programStackDepth++;
            if (programStackDepth === 1) {
              let sourceFile = env.meta.moduleName;
              let pathInfo = sourceFile && path.parse(sourceFile);
              if (pathInfo) {
                if (pathInfo.base === 'template.hbs') {
                  rewriterCallCount++;
                }
                let tagNameFile = input.path(`${pathInfo.name}.tagname`);
                if (fs.existsSync(tagNameFile)) {
                  let tagName = fs.readFileSync(tagNameFile, 'utf-8').trim();
                  rewriter.tagName = tagName;
                  rewriter.tagNameFile = tagNameFile;
                }
              }
            }
          },
          exit() {
            programStackDepth--;
          },
        },
        ElementNode(node) {
          if (node.tag === 'div') {
            node.tag = rewriter.tagName;
          }
        },
      },
    };
    return rewriter;
  }
  const DivRewriter = addDependencyTracker(DivRewriterImpl, true);

  they(
    'are accepted and used.',
    co.wrap(function* () {
      htmlbarsOptions.plugins = {
        ast: [DivRewriter],
      };

      tree = new TemplateCompiler(input.path(), htmlbarsOptions);

      output = createBuilder(tree);
      yield output.build();

      let templateOutput = output.readText('template.js');
      assert.ok(!templateOutput.match(/div/));
      assert.ok(templateOutput.match(/my-custom-element/));
      assert.strictEqual(rewriterCallCount, 1);
    })
  );

  they(
    'will bust the hot cache if the dependency changes.',
    co.wrap(function* () {
      Object.assign(htmlbarsOptions, {
        plugins: {
          ast: [DivRewriter],
        },
        dependencyInvalidation: true,
      });

      tree = new TemplateCompiler(input.path(), htmlbarsOptions);

      output = createBuilder(tree);
      yield output.build();

      let templateOutput = output.readText('template.js');
      assert.ok(!templateOutput.match(/div/));
      assert.ok(templateOutput.match(/my-custom-element/));
      assert.strictEqual(rewriterCallCount, 1);

      // The state didn't change. the output should be cached
      // and the rewriter shouldn't be invoked.
      yield output.build();
      assert.deepStrictEqual(output.changes(), {});
      templateOutput = output.readText('template.js');
      assert.ok(!templateOutput.match(/div/));
      assert.ok(templateOutput.match(/my-custom-element/));
      assert.strictEqual(rewriterCallCount, 1);

      // The state changes. the cache key updates and the template
      // should be recompiled.
      input.write({
        'template.tagname': 'MyChangedElement',
      });
      yield output.build();
      assert.deepStrictEqual(output.changes(), {
        'template.js': 'change',
        'template.tagname': 'change',
      });
      templateOutput = output.readText('template.js');
      assert.strictEqual(rewriterCallCount, 2);
      assert.ok(templateOutput.match(/my-changed-element/));
    })
  );

  describe('with persistent caching enabled', function () {
    let forcePersistenceValue;
    before(function () {
      forcePersistenceValue = process.env.FORCE_PERSISTENCE_IN_CI;
      process.env.FORCE_PERSISTENCE_IN_CI = 'true';
    });

    after(function () {
      process.env.FORCE_PERSISTENCE_IN_CI = forcePersistenceValue;
    });

    they(
      'will bust the persistent cache if the template cache key changes.',
      co.wrap(function* () {
        Object.assign(htmlbarsOptions, {
          plugins: {
            ast: [DivRewriter],
          },
          dependencyInvalidation: true,
        });

        let firstTree, secondTree, thirdTree;

        try {
          firstTree = new TemplateCompiler(input.path(), htmlbarsOptions);

          try {
            output = createBuilder(firstTree);
            yield output.build();

            let templateOutput = output.readText('template.js');
            assert.ok(!templateOutput.match(/div/));
            assert.ok(templateOutput.match(/my-custom-element/));
            assert.strictEqual(rewriterCallCount, 1);
          } finally {
            yield output.dispose();
          }

          // The state didn't change. the output should be cached
          // and the rewriter shouldn't be invoked.
          secondTree = new TemplateCompiler(input.path(), htmlbarsOptions);
          try {
            let output = createBuilder(secondTree);
            yield output.build();
            assert.deepStrictEqual(output.changes()['template.js'], 'create');
            // the "new" file is read from cache.
            let templateOutput = output.readText('template.js');
            assert.ok(!templateOutput.match(/div/));
            assert.ok(templateOutput.match(/my-custom-element/));
            assert.strictEqual(rewriterCallCount, 1);
          } finally {
            yield output.dispose();
          }

          // The state changes. the cache key updates and the template
          // should be recompiled.
          input.write({
            'template.tagname': 'MyChangedElement',
          });

          thirdTree = new TemplateCompiler(input.path(), htmlbarsOptions);
          try {
            let output = createBuilder(thirdTree);
            yield output.build();
            let templateOutput = output.readText('template.js');
            assert.strictEqual(rewriterCallCount, 2);
            assert.ok(templateOutput.match(/my-changed-element/));
            assert.strictEqual(rewriterCallCount, 2);
          } finally {
            yield output.dispose();
          }
        } finally {
          clearTreeCache(firstTree);
          clearTreeCache(secondTree);
          clearTreeCache(thirdTree);
        }
      })
    );
  });
});
