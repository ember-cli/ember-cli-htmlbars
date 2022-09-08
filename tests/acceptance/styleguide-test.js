import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | styleguide', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /styleguide', async function (assert) {
    await visit('/styleguide');

    assert.equal(currentURL(), '/styleguide');

    assert.dom('[data-test-es-note-heading]').containsText('says...');
  });
});
