'use strict';

const assert = require('assert');
const ColocatedTemplateCompiler = require('../lib/colocated-broccoli-plugin');
const { createTempDir, createBuilder } = require('broccoli-test-helper');
const { stripIndent } = require('common-tags');

describe('ColocatedTemplateCompiler', function() {
  this.timeout(10000);

  let input, output;

  beforeEach(async function() {
    input = await createTempDir();
  });

  afterEach(async function() {
    await input.dispose();

    if (output) {
      await output.dispose();
    }
  });

  it('works for template only component', async function() {
    input.write({
      'app-name-here': {
        components: {
          'foo.hbs': `{{yield}}`,
        },
        templates: {
          'application.hbs': `{{outlet}}`,
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      'app-name-here': {
        components: {
          'foo.js':
            stripIndent`
            import { hbs } from 'ember-cli-htmlbars';
            const __COLOCATED_TEMPLATE__ = hbs("{{yield}}", {"contents":"{{yield}}","moduleName":"app-name-here/components/foo.hbs","parseOptions":{"srcName":"app-name-here/components/foo.hbs"}});
            import templateOnly from '@ember/component/template-only';

            export default templateOnly();` + '\n',
        },
        templates: {
          'application.hbs': '{{outlet}}',
        },
      },
    });
  });

  it('works for component with template and class', async function() {
    input.write({
      'app-name-here': {
        components: {
          'foo.hbs': `{{yield}}`,
          'foo.js': stripIndent`
            import Component from '@glimmer/component';

            export default class FooComponent extends Component {}
          `,
        },
        templates: {
          'application.hbs': `{{outlet}}`,
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      'app-name-here': {
        components: {
          'foo.js': stripIndent`
            import { hbs } from 'ember-cli-htmlbars';
            const __COLOCATED_TEMPLATE__ = hbs("{{yield}}", {"contents":"{{yield}}","moduleName":"app-name-here/components/foo.hbs","parseOptions":{"srcName":"app-name-here/components/foo.hbs"}});
            import Component from '@glimmer/component';

            export default class FooComponent extends Component {}
          `,
        },
        templates: {
          'application.hbs': '{{outlet}}',
        },
      },
    });
  });

  it('works for scoped addon using template only component', async function() {
    input.write({
      '@scope-name': {
        'addon-name-here': {
          components: {
            'foo.hbs': `{{yield}}`,
          },
          templates: {
            'application.hbs': `{{outlet}}`,
          },
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      '@scope-name': {
        'addon-name-here': {
          components: {
            'foo.js':
              stripIndent`
            import { hbs } from 'ember-cli-htmlbars';
            const __COLOCATED_TEMPLATE__ = hbs("{{yield}}", {"contents":"{{yield}}","moduleName":"@scope-name/addon-name-here/components/foo.hbs","parseOptions":{"srcName":"@scope-name/addon-name-here/components/foo.hbs"}});
            import templateOnly from '@ember/component/template-only';

            export default templateOnly();` + '\n',
          },
          templates: {
            'application.hbs': '{{outlet}}',
          },
        },
      },
    });
  });

  it('works for scoped addon using component with template and class', async function() {
    input.write({
      '@scope-name': {
        'addon-name-here': {
          components: {
            'foo.hbs': `{{yield}}`,
            'foo.js': stripIndent`
            import Component from '@glimmer/component';

            export default class FooComponent extends Component {}
          `,
          },
          templates: {
            'application.hbs': `{{outlet}}`,
          },
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      '@scope-name': {
        'addon-name-here': {
          components: {
            'foo.js': stripIndent`
            import { hbs } from 'ember-cli-htmlbars';
            const __COLOCATED_TEMPLATE__ = hbs("{{yield}}", {"contents":"{{yield}}","moduleName":"@scope-name/addon-name-here/components/foo.hbs","parseOptions":{"srcName":"@scope-name/addon-name-here/components/foo.hbs"}});
            import Component from '@glimmer/component';

            export default class FooComponent extends Component {}
          `,
          },
          templates: {
            'application.hbs': '{{outlet}}',
          },
        },
      },
    });
  });

  it('does nothing for "classic" location components', async function() {
    input.write({
      'app-name-here': {
        components: {
          'foo.js': stripIndent`
            import Component from '@glimmer/component';

            export default class FooComponent extends Component {}
          `,
        },
        templates: {
          'application.hbs': `{{outlet}}`,
          components: {
            'foo.hbs': `{{yield}}`,
          },
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), input.read());
  });

  it('does nothing for "pod" location templates', async function() {
    input.write({
      'addon-name-here': {
        components: {
          foo: {
            'template.hbs': `{{yield}}`,
          },
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), input.read());
  });

  it('it works if there are no input files', async function() {
    input.write({});

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {});
  });

  it('it works if input is manually using setComponentTemplate - no colocated template exists', async function() {
    input.write({
      'app-name-here': {
        components: {
          'foo.js': stripIndent`
            import Component from '@glimmer/component';
            import { setComponentTemplate } from '@ember/component';
            import hbs from 'ember-cli-htmlbars-inline-precompile';

            export default class FooComponent extends Component {}
            setComponentTemplate(FooComponent, hbs\`sometemplate\`);
          `,
        },
        templates: {
          'application.hbs': `{{outlet}}`,
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      'app-name-here': {
        components: {
          'foo.js': stripIndent`
            import Component from '@glimmer/component';
            import { setComponentTemplate } from '@ember/component';
            import hbs from 'ember-cli-htmlbars-inline-precompile';

            export default class FooComponent extends Component {}
            setComponentTemplate(FooComponent, hbs\`sometemplate\`);
          `,
        },
        templates: {
          'application.hbs': '{{outlet}}',
        },
      },
    });
  });

  it('emits an error when a default export is not present in a component JS file', async function() {
    input.write({
      'app-name-here': {
        components: {
          'foo.hbs': `{{yield}}`,
          'foo.js': stripIndent`
            export function whatever() {}
          `,
        },
      },
    });

    let tree = new ColocatedTemplateCompiler(input.path(), {
      precompile(template) {
        return JSON.stringify({ template });
      },
    });

    output = createBuilder(tree);
    await output.build();

    assert.deepStrictEqual(output.read(), {
      'app-name-here': {
        components: {
          'foo.js': stripIndent`
            export function whatever() {}\nthrow new Error("\`app-name-here/components/foo.hbs\` does not contain a \`default export\`. Did you forget to export the component class?");
          `,
        },
      },
    });
  });

  it('does not break class decorator usage');
});
