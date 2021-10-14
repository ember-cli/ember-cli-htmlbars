'use strict';

const assert = require('assert');
const babel = require('@babel/core');
const { stripIndent } = require('common-tags');
const ColocatedBabelPlugin = require('../lib/colocated-babel-plugin');
const DecoratorsPlugin = [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }];
const TypeScriptPlugin = [require.resolve('@babel/plugin-transform-typescript')];
const ClassPropertiesPlugin = [
  require.resolve('@babel/plugin-proposal-class-properties'),
  { loose: true },
];
const RuntimePlugin = [
  require.resolve('@babel/plugin-transform-runtime'),
  {
    version: require('@babel/runtime/package').version,
    regenerator: false,
    useESModules: true,
  },
];

describe('ColocatedBabelPlugin', function () {
  this.slow(500);

  describe('requiresModuleApiPolyfill: true', function () {
    const ColocatedBabelPluginOptions = [ColocatedBabelPlugin, { requiresModuleApiPolyfill: true }];

    it('can be used with decorators', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from '@glimmer/component';
          const __COLOCATED_TEMPLATE__ = 'ok';

          export default class MyComponent extends Component {
            @tracked data = null;
          };
        `,
        {
          plugins: [
            RuntimePlugin,
            ColocatedBabelPluginOptions,
            DecoratorsPlugin,
            ClassPropertiesPlugin,
          ],
        }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import _initializerDefineProperty from "@babel/runtime/helpers/esm/initializerDefineProperty";
          import _applyDecoratedDescriptor from "@babel/runtime/helpers/esm/applyDecoratedDescriptor";
          import _initializerWarningHelper from "@babel/runtime/helpers/esm/initializerWarningHelper";

          var _class, _descriptor;

          import Component from '@glimmer/component';
          const __COLOCATED_TEMPLATE__ = 'ok';
          let MyComponent = (_class = class MyComponent extends Component {
            constructor(...args) {
              super(...args);

              _initializerDefineProperty(this, "data", _descriptor, this);
            }

          }, (_descriptor = _applyDecoratedDescriptor(_class.prototype, "data", [tracked], {
            configurable: true,
            enumerable: true,
            writable: true,
            initializer: function () {
              return null;
            }
          })), _class);
          export { MyComponent as default };
          ;

          Ember._setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });

    it('can be used with TypeScript merged declarations', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          type MyArgs = { required: string; optional?: number };

          export default interface MyComponent extends MyArgs {}
          export default class MyComponent extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions, TypeScriptPlugin] }
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

    it('sets the template for non-class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import MyComponent from 'other-module';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default MyComponent;
        `,
        { plugins: [ColocatedBabelPluginOptions] }
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

    it('sets the template for named class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class MyComponent extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions] }
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

    it('sets the template for anonymous class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions] }
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

    it('sets the template for identifier `as default` exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          const MyComponent = class extends Component {};
          export { MyComponent as default };
        `,
        { plugins: [ColocatedBabelPluginOptions] }
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

  describe('requiresModuleApiPolyfill: false', function () {
    const ColocatedBabelPluginOptions = [
      ColocatedBabelPlugin,
      { requiresModuleApiPolyfill: false },
    ];

    it('can be used with decorators', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from '@glimmer/component';
          const __COLOCATED_TEMPLATE__ = 'ok';

          export default class MyComponent extends Component {
            @tracked data = null;
          };
        `,
        {
          plugins: [
            RuntimePlugin,
            ColocatedBabelPluginOptions,
            DecoratorsPlugin,
            ClassPropertiesPlugin,
          ],
        }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import _initializerDefineProperty from "@babel/runtime/helpers/esm/initializerDefineProperty";
          import _applyDecoratedDescriptor from "@babel/runtime/helpers/esm/applyDecoratedDescriptor";
          import _initializerWarningHelper from "@babel/runtime/helpers/esm/initializerWarningHelper";

          var _class, _descriptor;

          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import Component from '@glimmer/component';
          const __COLOCATED_TEMPLATE__ = 'ok';
          let MyComponent = (_class = class MyComponent extends Component {
            constructor(...args) {
              super(...args);

              _initializerDefineProperty(this, "data", _descriptor, this);
            }

          }, (_descriptor = _applyDecoratedDescriptor(_class.prototype, "data", [tracked], {
            configurable: true,
            enumerable: true,
            writable: true,
            initializer: function () {
              return null;
            }
          })), _class);
          export { MyComponent as default };
          ;

          _setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });

    it('can be used with TypeScript merged declarations', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          type MyArgs = { required: string; optional?: number };

          export default interface MyComponent extends MyArgs {}
          export default class MyComponent extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions, TypeScriptPlugin] }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class MyComponent extends Component {}

          _setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });

    it('sets the template for non-class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import MyComponent from 'other-module';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default MyComponent;
        `,
        { plugins: [ColocatedBabelPluginOptions] }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import MyComponent from 'other-module';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default _setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });

    it('sets the template for named class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class MyComponent extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions] }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class MyComponent extends Component {}

          _setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });

    it('sets the template for anonymous class default exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default class extends Component {}
        `,
        { plugins: [ColocatedBabelPluginOptions] }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          export default _setComponentTemplate(__COLOCATED_TEMPLATE__, class extends Component {});
        `
      );
    });

    it('sets the template for identifier `as default` exports', function () {
      let { code } = babel.transformSync(
        stripIndent`
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          const MyComponent = class extends Component {};
          export { MyComponent as default };
        `,
        { plugins: [ColocatedBabelPluginOptions] }
      );

      assert.strictEqual(
        code,
        stripIndent`
          import { setComponentTemplate as _setComponentTemplate } from "@ember/component";
          import Component from 'somewhere';
          const __COLOCATED_TEMPLATE__ = 'ok';
          const MyComponent = class extends Component {};
          export { MyComponent as default };

          _setComponentTemplate(__COLOCATED_TEMPLATE__, MyComponent);
        `
      );
    });
  });
});
