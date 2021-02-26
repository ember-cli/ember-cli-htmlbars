'use strict';

const co = require('co');
const expect = require('chai').expect;
const MockUI = require('console-ui/mock');
const CoreObject = require('core-object');
const AddonMixin = require('../lib/ember-addon-main');
const BroccoliTestHelper = require('broccoli-test-helper');
const createBuilder = BroccoliTestHelper.createBuilder;
const createTempDir = BroccoliTestHelper.createTempDir;

let Addon = CoreObject.extend(AddonMixin);

describe('ember-cli-htmlbars addon', function () {
  const ORIGINAL_EMBER_ENV = process.env.EMBER_ENV;

  beforeEach(function () {
    this.ui = new MockUI();
    let project = {
      isEmberCLIProject: () => true,
      _addonsInitialized: true,
      root: __dirname,
      emberCLIVersion: () => '2.16.2',
      dependencies() {
        return {};
      },
      addons: [],
      targets: {
        browsers: ['ie 11'],
      },
    };

    this.addon = new Addon({
      project,
      parent: project,
      ui: this.ui,
    });

    project.addons.push(this.addon);
  });

  afterEach(function () {
    if (ORIGINAL_EMBER_ENV === undefined) {
      delete process.env.EMBER_ENV;
    } else {
      process.env.EMBER_ENV = ORIGINAL_EMBER_ENV;
    }
  });

  describe('transpileTree', function () {
    this.timeout(0);

    let input;
    let output;
    let subject;

    beforeEach(
      co.wrap(function* () {
        input = yield createTempDir();
      })
    );

    afterEach(
      co.wrap(function* () {
        yield input.dispose();
        yield output.dispose();
      })
    );

    it(
      'should build',
      co.wrap(function* () {
        input.write({
          'hello.hbs': `<div>Hello, World!</div>`,
        });

        let htmlbarsOptions = {
          isHTMLBars: true,
          templateCompiler: require('ember-source/dist/ember-template-compiler.js'),
          templateCompilerPath: require.resolve('ember-source/dist/ember-template-compiler.js'),
        };

        subject = this.addon.transpileTree(input.path(), htmlbarsOptions);
        output = createBuilder(subject);

        yield output.build();

        expect(output.read()).to.deep.equal({
          'hello.js':
            'export default Ember.HTMLBars.template({"id":"pb4oG9l/","block":"[[[10,0],[12],[1,\\"Hello, World!\\"],[13]],[],false,[]]","moduleName":"hello.hbs","isStrictMode":false});',
        });
      })
    );
  });
});
