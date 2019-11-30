'use strict';

const fs = require('fs');
const mkdirp = require('mkdirp');
const copyFileSync = require('fs-copy-file-sync');
const path = require('path');
const walkSync = require('walk-sync');
const Plugin = require('broccoli-plugin');
const logger = require('heimdalljs-logger')('ember-cli-htmlbars:colocated-broccoli-plugin');

function detectRootName(files) {
  let [first] = files;
  let parts = first.split('/');

  let root;
  if (parts[0].startsWith('@')) {
    root = parts.slice(0, 2).join('/');
  } else {
    root = parts[0];
  }

  if (!files.every(f => f.startsWith(root))) {
    root = null;
  }

  return root;
}

module.exports = class ColocatedTemplateProcessor extends Plugin {
  constructor(tree, options) {
    super([tree], options);
  }

  build() {
    let files = walkSync(this.inputPaths[0], { directories: false });

    if (files.length === 0) {
      // nothing to do, bail
      return;
    }

    let root = detectRootName(files);

    let filesToCopy = [];
    files.forEach(filePath => {
      if (root === null) {
        // do nothing, we cannot detect the proper root path for the app/addon
        // being processed
        filesToCopy.push(filePath);
        return;
      }

      let filePathParts = path.parse(filePath);
      let inputPath = path.join(this.inputPaths[0], filePath);

      // TODO: why are these different?
      // Apps: my-app/components/foo.hbs, my-app/templates/components/foo.hbs
      // Addons: components/foo.js, templates/components/foo.hbs
      //
      // will be fixed by https://github.com/ember-cli/ember-cli/pull/8834

      let isInsideComponentsFolder = filePath.startsWith(`${root}/components/`);

      // copy forward non-hbs files
      // TODO: don't copy .js files that will ultimately be overridden
      if (!isInsideComponentsFolder || filePathParts.ext !== '.hbs') {
        filesToCopy.push(filePath);
        return;
      }

      if (filePathParts.name === 'template') {
        filesToCopy.push(filePath);
        return;
      }

      let hasBackingClass = false;
      let backingClassPath = path.join(filePathParts.dir, filePathParts.name);

      if (fs.existsSync(path.join(this.inputPaths[0], backingClassPath + '.js'))) {
        backingClassPath += '.js';
        hasBackingClass = true;
      } else if (fs.existsSync(path.join(this.inputPaths[0], backingClassPath + '.ts'))) {
        backingClassPath += '.ts';
        hasBackingClass = true;
      } else if (fs.existsSync(path.join(this.inputPaths[0], backingClassPath + '.coffee'))) {
        backingClassPath += '.coffee';
        hasBackingClass = true;
      } else {
        backingClassPath += '.js';
        hasBackingClass = false;
      }

      let templateContents = fs.readFileSync(inputPath, { encoding: 'utf8' });
      let jsContents = null;

      let hbsInvocationOptions = {
        contents: templateContents,
        moduleName: filePath,
        parseOptions: {
          srcName: filePath,
        },
      };
      let hbsInvocation = `hbs(${JSON.stringify(templateContents)}, ${JSON.stringify(
        hbsInvocationOptions
      )})`;
      let prefix = `import { hbs } from 'ember-cli-htmlbars';\nconst __COLOCATED_TEMPLATE__ = ${hbsInvocation};\n`;
      if (backingClassPath.endsWith('.coffee')) {
        prefix = `import { hbs } from 'ember-cli-htmlbars'\n__COLOCATED_TEMPLATE__ = ${hbsInvocation}\n`;
      }

      logger.debug(
        `processing colocated template: ${filePath} (template-only: ${hasBackingClass})`
      );

      if (hasBackingClass) {
        // add the template, call setComponentTemplate

        jsContents = fs.readFileSync(path.join(this.inputPaths[0], backingClassPath), {
          encoding: 'utf8',
        });

        if (!jsContents.includes('export default')) {
          let message = `\`${filePath}\` does not contain a \`default export\`. Did you forget to export the component class?`;
          jsContents = `${jsContents}\nthrow new Error(${JSON.stringify(message)});`;
          prefix = '';
        }
      } else {
        // create JS file, use null component pattern

        jsContents = `import templateOnly from '@ember/component/template-only';\n\nexport default templateOnly();\n`;
      }

      jsContents = prefix + jsContents;

      let outputPath = path.join(this.outputPath, backingClassPath);

      // TODO: don't speculatively mkdirSync (likely do in a try/catch with ENOENT)
      mkdirp.sync(path.dirname(outputPath));
      fs.writeFileSync(outputPath, jsContents, { encoding: 'utf8' });
    });

    filesToCopy.forEach(filePath => {
      let inputPath = path.join(this.inputPaths[0], filePath);
      let outputPath = path.join(this.outputPath, filePath);

      // avoid copying file over top of a previously written one
      if (fs.existsSync(outputPath)) {
        return;
      }

      logger.debug(`copying unchanged file: ${filePath}`);

      // TODO: don't speculatively mkdirSync (likely do in a try/catch with ENOENT)
      mkdirp.sync(path.dirname(outputPath));
      copyFileSync(inputPath, outputPath);
    });

    logger.info(`copied over (unchanged): ${filesToCopy.length} files`);
  }
};
