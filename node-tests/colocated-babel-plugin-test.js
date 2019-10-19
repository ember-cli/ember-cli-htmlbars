'use strict';

const assert = require('assert');
const babel = require('@babel/core');
const { stripIndent } = require('common-tags');
const ColocatedBabelPlugin = require('../lib/colocated-babel-plugin');

describe('ColocatedBabelPlugin', function() {
  this.slow(500);

  it('sets the template for non-class default exports', function() {
    let { code } = babel.transformSync(
      stripIndent`
        import MyComponent from 'other-module';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default MyComponent;
      `,
      { plugins: [ColocatedBabelPlugin] }
    );

    assert.strictEqual(
      code,
      stripIndent`
        import MyComponent from 'other-module';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default Ember._setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
      `
    );
  });

  it('sets the template for named class default exports', function() {
    let { code } = babel.transformSync(
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default class MyComponent extends Component {}
      `,
      { plugins: [ColocatedBabelPlugin] }
    );

    assert.strictEqual(
      code,
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default class MyComponent extends Component {}

        Ember._setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
      `
    );
  });

  it('sets the template for anonymous class default exports', function() {
    let { code } = babel.transformSync(
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default class extends Component {}
      `,
      { plugins: [ColocatedBabelPlugin] }
    );

    assert.strictEqual(
      code,
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        export default Ember._setComponentTemplate(__COLOCATED_TEMPLATE__, class extends Component {});
      `
    );
  });

  it('sets the template for identifier `as default` exports', function() {
    let { code } = babel.transformSync(
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        const MyComponent = class extends Component {};
        export { MyComponent as default };
      `,
      { plugins: [ColocatedBabelPlugin] }
    );

    assert.strictEqual(
      code,
      stripIndent`
        import Component from 'somewhere';
        const __COLOCATED_TEMPLATE__ = 'ok';
        const MyComponent = class extends Component {};
        export { MyComponent as default };

        Ember._setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
      `
    );
  });
});
