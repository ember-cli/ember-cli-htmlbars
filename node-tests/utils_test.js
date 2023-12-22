'use strict';

const utils = require('../lib/utils');
const assert = require('assert');

describe('utils', function () {
  describe('isColocatedBabelPluginRegistered', function () {
    it('is false when no plugins exist', function () {
      let plugins = [];

      assert.strictEqual(
        utils.isColocatedBabelPluginRegistered(plugins),
        false,
      );
    });

    it('detects when the plugin exists', function () {
      let plugins = [require.resolve('../lib/colocated-babel-plugin')];

      assert.strictEqual(utils.isColocatedBabelPluginRegistered(plugins), true);
    });
  });
});
