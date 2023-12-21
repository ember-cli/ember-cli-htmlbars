const { Assertion, expect } = require('chai');
const { codeEqual } = require('code-equality-assertions');

// code-equality-assertions comes with integrations for qunit and jest. This
// test suite was using a mix of chai and Node build-in assert.

function assertEqualCode(actual, expected, message = '') {
  let status = codeEqual(actual, expected);
  this.assert(status.result, message + status.diff);
}

Assertion.addMethod('toEqualCode', function (expectedSrc) {
  assertEqualCode.call(this, this._obj, expectedSrc);
});

// need this because there are tests for coffeescript 🙄
function simpleNormalize(s) {
  return s.trim().replace(/\n\s+/g, '\n');
}

function assertNonJSEqual(actual, expected, message) {
  actual = simpleNormalize(actual);
  expected = simpleNormalize(expected);
  this.assert(actual === expected, message, message, actual, expected);
}

function deepEqualCode(actual, expected, message = '') {
  for (let [key, value] of Object.entries(expected)) {
    if (typeof value === 'string') {
      if (key.endsWith('.js') || key.endsWith('.ts')) {
        assertEqualCode.call(this, actual[key], value, `${message}->${key}`);
      } else {
        assertNonJSEqual.call(this, actual[key], value, `${message}->${key}`);
      }
    } else {
      deepEqualCode.call(this, actual[key], value, `${message}->${key}`);
    }
  }
}

Assertion.addMethod('toDeepEqualCode', function (expectedTree) {
  deepEqualCode.call(this, this._obj, expectedTree);
});

exports.expect = expect;
