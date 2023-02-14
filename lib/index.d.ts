// Shut off automatically-export-everything-mode. We only want to export the
// things we explicitly *say* to export.
export {};

// Allows us to create a branded/opaque type which can *only* be constructed
// without an unsafe cast by calling `hbs()`.
declare const Data: unique symbol;

/**
  The result of calling `hbs()`: an internal type for Ember to use with other
  framework-level APIs (public and private) like `setComponentTemplate()`.

  This type is *not* user-constructible; it is only legal to get it from `hbs`.
 */
declare class TemplateFactory {
  private [Data]: 'template-factory';
}

// Only export the type side of the class, so that callers are not misled into
// thinking that they can instantiate, subclass, etc.
export type { TemplateFactory };

export interface PrecompileOptions {
  moduleName?: string;
  parseOptions?: {
    srcName?: string;
  };
}

/**
 * A helper for rendering components.
 *
 * @param tagged The template to render.
 *
 * ## Usage
 *
 * ### With tagged template
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
 *
 * ## With string and options
 *
 * ```ts
 * import Component from '@glimmer/component';
 * import { setComponentTemplate } from '@ember/component';
 * import { hbs } from 'ember-cli-htmlbars';
 *
 * class Hello extends Component {
 *   greeting = 'hello world';
 * }
 *
 * setComponentTemplate(
 *   hbs('<p>{{this.greeting}}</p>', { moduleName: 'hello.hbs' }),
 *   MyComponent
 * );
 * ```
 */
export function hbs(template: string, options?: PrecompileOptions): TemplateFactory;
export function hbs(tagged: TemplateStringsArray): TemplateFactory;
