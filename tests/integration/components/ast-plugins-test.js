import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import hasEmberVersion from '@ember/test-helpers/has-ember-version';

module('tests/integration/components/ast-plugins-test', function(hooks) {
  setupRenderingTest(hooks);

  test('stand alone templates have "legacy" AST plugins ran', async function(assert) {
    await render(hbs`{{x-module-name-reversed-component}}`);

    assert.equal(
      this.element.textContent.trim(),
      'sbh.tnenopmoc-desrever-eman-eludom-x/stnenopmoc/setalpmet/ymmud'
    );
  });

  if (hasEmberVersion(3, 1)) {
    test('stand alone templates have AST plugins ran', async function(assert) {
      await render(hbs`{{x-module-name-inlined-component}}`);

      assert.equal(
        this.element.textContent.trim(),
        'dummy/templates/components/x-module-name-inlined-component.hbs'
      );
    });
  }
});
