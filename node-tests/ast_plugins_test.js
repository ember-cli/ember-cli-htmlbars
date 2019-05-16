'use strict';

const path = require('path');
const assert = require('assert');
const TemplateCompiler = require('../index');
const co = require('co');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const fixturify = require('fixturify');

describe('AST plugins', function(){
  const they = it;
  this.timeout(10000);

  let input, output, builder, tree, htmlbarsOptions;

  beforeEach(co.wrap(function*() {
    templateCacheKeyState = 0;
    rewriterCallCount = 0;
    input = yield createTempDir();
    input.write(fixturify.readSync(`${__dirname}/fixtures`));
    htmlbarsOptions = {
      isHTMLBars: true,
      templateCompiler: require('ember-source/dist/ember-template-compiler.js')
    };
  }));

  afterEach(co.wrap(function*() {
    if (tree) {
      tree.unregisterPlugins();
      yield tree.processor.processor._cache.clear();
    }

    if (builder) {
      builder.cleanup();
    }

    yield input.dispose();

    if (output) {
      yield output.dispose();
    }
  }));

  let templateCacheKeyState, rewriterCallCount;
  const DivRewriter = {
    name: "test-div-rewriter",
    visitor: {
      Program(node) {
        let basename = node.loc.source && path.basename(node.loc.source);
        if (basename && basename === "template.hbs") {
          console.dir(node);
          rewriterCallCount++;
        }
      },
      ElementNode(node) {
        if (node.tag === "div") {
          node.tag = "span-"+templateCacheKeyState;
        }
      }
    }
  }


  they('are accepted and used.', co.wrap(function* () {
    htmlbarsOptions.plugins = {
      ast: [() => DivRewriter]
    };

    tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();

    let templateOutput = output.readText('template.js');
    assert.ok(!templateOutput.match(/div/));
    assert.ok(templateOutput.match(/span-0/));
    assert.strictEqual(rewriterCallCount, 1);
  }));

  they('will bust the hot cache if the template cache key changes.', co.wrap(function* () {
    Object.assign(htmlbarsOptions, {
      plugins: {
        ast: [() => DivRewriter]
      },
      templateCacheKey(relativePath) {
        let key = relativePath + ":" + templateCacheKeyState;
        console.log("template cache key is", key);
        return key;
      }
    });

    tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();
    let templateOutput = output.readText('template.js');
    assert.ok(!templateOutput.match(/div/));
    assert.ok(templateOutput.match(/span-0/));
    assert.strictEqual(rewriterCallCount, 1);

    // The state didn't change. the output should be cached
    // and the rewriter shouldn't be invoked.
    yield output.build();
    templateOutput = output.readText('template.js');
    assert.ok(!templateOutput.match(/div/));
    assert.ok(templateOutput.match(/span-0/));
    assert.strictEqual(rewriterCallCount, 1);

    // The state changes. the cache key updates and the template
    // should be recompiled.
    templateCacheKeyState++;
    assert.strictEqual(htmlbarsOptions.templateCacheKey("foo"), "foo:1");
    yield output.build();
    templateOutput = output.readText('template.js');
    // XXX This fails because the hot cache is not invalidated when the cache
    // XXX key changes.
    assert.strictEqual(rewriterCallCount, 2);
    assert.ok(templateOutput.match(/span-1/));
  }));

  they('will bust the persistent cache if the template cache key changes.', co.wrap(function* () {
    Object.assign(htmlbarsOptions, {
      plugins: {
        ast: [() => DivRewriter]
      },
      templateCacheKey(relativePath) {
        let key = relativePath + ":" + templateCacheKeyState;
        console.log("template cache key is", key);
        return key;
      }
    });

    tree = new TemplateCompiler(input.path(), htmlbarsOptions);

    output = createBuilder(tree);
    yield output.build();
    let templateOutput = output.readText('template.js');
    assert.ok(!templateOutput.match(/div/));
    assert.ok(templateOutput.match(/span-0/));
    assert.strictEqual(rewriterCallCount, 1);
    yield output.dispose();
    tree.unregisterPlugins();

    // The state didn't change. the output should be cached
    // and the rewriter shouldn't be invoked.
    tree = new TemplateCompiler(input.path(), htmlbarsOptions);
    output = createBuilder(tree);
    yield output.build();
    templateOutput = output.readText('template.js');
    assert.ok(!templateOutput.match(/div/));
    assert.ok(templateOutput.match(/span-0/));
    assert.strictEqual(rewriterCallCount, 1);
    yield output.dispose();
    tree.unregisterPlugins();

    // The state changes. the cache key updates and the template
    // should be recompiled.
    templateCacheKeyState++;
    assert.strictEqual(htmlbarsOptions.templateCacheKey("foo"), "foo:1");
    tree = new TemplateCompiler(input.path(), htmlbarsOptions);
    output = createBuilder(tree);
    yield output.build();
    templateOutput = output.readText('template.js');
    assert.strictEqual(rewriterCallCount, 2);
    assert.ok(templateOutput.match(/span-1/));
    assert.strictEqual(rewriterCallCount, 2);
  }));
});