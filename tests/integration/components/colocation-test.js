import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { HAS_OCTANE } from '@ember/edition-fake-module';

module('tests/integration/components/test-inline-precompile', function(hooks) {
  if (!HAS_OCTANE) {
    // can only run against 3.13+ (due to colocation support)
    return;
  }

  setupRenderingTest(hooks);

  test('registered ast plugins run against colocated templates (template-only)', async function(assert) {
    await render(hbs`<Foo />`);

    assert.equal(this.element.textContent.trim(), 'Module: dummy/components/foo.hbs');
  });

  test('registered ast plugins run against nested colocated templates (template-only)', async function(assert) {
    await render(hbs`<Foo::Bar />`);

    assert.equal(this.element.textContent.trim(), 'Module: dummy/components/foo/bar.hbs');
  });

  test('registered ast plugins run against colocated template index files (template-only)', async function(assert) {
    await render(hbs`<Baz />`);

    assert.equal(this.element.textContent.trim(), 'Module: dummy/components/baz/index.hbs');
  });

  test('registered ast plugins run against nested colocated template index files (template-only)', async function(assert) {
    await render(hbs`<Foo::Baz />`);

    assert.equal(this.element.textContent.trim(), 'Module: dummy/components/foo/baz/index.hbs');
  });

  test('can invoke native class based component with decorators', async function(assert) {
    await render(hbs`<ItsNative />`);

    assert.equal(this.element.textContent.trim(), 'Hello!');
  });
});
