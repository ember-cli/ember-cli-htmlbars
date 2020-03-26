// Using the same "brand" as the types for `htmlbars-inline-precompile` for
// backwards compatibility. The actual value of the brand doesn't matter; it is
// only important that it (a) is distinct and (b) interoperates with existing
// uses of the `hbs` export from `htmlbars-inline-precompile`.
//
// Note that we *intentionally* do not export this; the details are irrelevant
// to consumers. The point is simply to have a *distinct* type that is therefore
// not substitutable for just any other type.
interface TemplateFactory {
  __htmlbars_inline_precompile_template_factory: any;
}

/**
 * A helper for rendering components in tests.
 *
 * @param tagged The template to render for the test.
 *
 * ## Example usage
 *
 * ```ts
 * import { module, test } from 'qunit';
 * import { setupRenderingTest } from 'ember-qunit';
 * import { render } from '@ember/test-helpers';
 * import { hbs } from 'ember-cli-htmlbars';
 *
 * module('demonstrate hbs usage', function(hooks) {
 *   setupRenderingTest(hooks);
 *
 *   test('you can render things', function(assert) {
 *     await render(hbs`<TestingComponents @isCool={{true}} />`);
 *     assert.ok(true);
 *   });
 * });
 * ```
 */
export function hbs(tagged: TemplateStringsArray): TemplateFactory;
