import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('tests/integration/components/ast-plugins-test', function (hooks) {
  setupRenderingTest(hooks);

  test('stand alone templates have AST plugins ran', async function (assert) {
    await render(hbs`<XModuleNameInlinedComponent/>`);

    assert.strictEqual(
      this.element.textContent.trim(),
      'dummy/components/x-module-name-inlined-component.hbs',
    );
  });
});
