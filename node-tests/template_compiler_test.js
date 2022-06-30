'use strict';

const assert = require('assert');
const TemplateCompiler = require('../lib/template-compiler-plugin');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const fixturify = require('fixturify');
const jsStringEscape = require('js-string-escape');

describe('TemplateCompiler', function () {
  this.timeout(10000);

  let input, output, builder;

  beforeEach(async function () {
    input = await createTempDir();
    input.write(fixturify.readSync(`${__dirname}/fixtures`));
  });

  afterEach(async function () {
    if (builder) {
      builder.cleanup();
    }
    await input.dispose();
    if (output) {
      await output.dispose();
    }
  });

  it('converts hbs into JS', async function () {
    let tree = new TemplateCompiler(input.path());

    output = createBuilder(tree);
    await output.build();

    let source = input.readText('template.hbs');
    let expected = [
      `import { hbs } from 'ember-cli-htmlbars';`,
      `export default hbs('${jsStringEscape(source)}', { moduleName: 'template.hbs' });`,
      '',
    ].join('\n');
    assert.strictEqual(output.readText('template.js'), expected);
  });
});
