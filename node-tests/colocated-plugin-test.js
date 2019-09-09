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
          'foo.js': stripIndent`
            const templateOnlyComponent = Ember._templateOnlyComponent;
            const setComponentTemplate = Ember._setComponentTemplate;
            const TEMPLATE = {"template":"{{yield}}"};
            const CLASS = templateOnlyComponent();
            export default setComponentTemplate(TEMPLATE, CLASS);
          `,
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
            import Component from '@glimmer/component';

            const CLASS = class FooComponent extends Component {}
            const setComponentTemplate = Ember._setComponentTemplate;
            const TEMPLATE = {"template":"{{yield}}"};
            export default setComponentTemplate(TEMPLATE, CLASS);
          `,
        },
        templates: {
          'application.hbs': '{{outlet}}',
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
});
