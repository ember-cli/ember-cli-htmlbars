import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbsOne from 'htmlbars-inline-precompile';
import hbsTwo from 'ember-cli-htmlbars-inline-precompile';
import { hbs as hbsThree } from 'ember-cli-htmlbars';

module('tests/integration/components/test-inline-precompile', function(hooks) {
  setupRenderingTest(hooks);

  test('htmlbars-inline-precompile works', async function(assert) {
    await render(hbsOne`Wheeeee`);

    assert.equal(this.element.textContent.trim(), 'Wheeeee');
  });

  test('ember-cli-htmlbars-inline-precompile works', async function(assert) {
    await render(hbsTwo`Wheeeee`);

    assert.equal(this.element.textContent.trim(), 'Wheeeee');
  });

  test('ember-cli-htmlbars works', async function(assert) {
    await render(hbsThree`Wheeeee`);

    assert.equal(this.element.textContent.trim(), 'Wheeeee');
  });
});
