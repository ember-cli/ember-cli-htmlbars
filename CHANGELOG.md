# Changelog

## v5.7.2 (2021-12-05)

#### :bug: Bug Fix
* [#740](https://github.com/ember-cli/ember-cli-htmlbars/pull/740) Allow console messages (v5.x) ([@mixonic](https://github.com/mixonic))

#### Committers: 1
- Matthew Beale ([@mixonic](https://github.com/mixonic))


## v5.7.1 (2021-03-18)

#### :bug: Bug Fix
* [#685](https://github.com/ember-cli/ember-cli-htmlbars/pull/685) Ensure global is present for Node 10 + globalThis polyfill ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.7.0 (2021-03-18)

#### :rocket: Enhancement
* [#683](https://github.com/ember-cli/ember-cli-htmlbars/pull/683) Disable the modules API polyfill on Ember 3.27+ ([@pzuraq](https://github.com/pzuraq))

#### :house: Internal
* [#684](https://github.com/ember-cli/ember-cli-htmlbars/pull/684) Update babel-plugin-htmlbars-inline-precompile to 4.4.6. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Chris Garrett ([@pzuraq](https://github.com/pzuraq))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.6.5 (2021-03-12)

#### :bug: Bug Fix
* [#680](https://github.com/ember-cli/ember-cli-htmlbars/pull/680) Update inline template compilation plugin to avoid errors on rebuilds ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.6.4 (2021-03-07)

#### :bug: Bug Fix
* [#678](https://github.com/ember-cli/ember-cli-htmlbars/pull/678) Make `setTimeout`/`clearTimeout` available to the template compiler sandbox ([@rwjblue](https://github.com/rwjblue))
* [#677](https://github.com/ember-cli/ember-cli-htmlbars/pull/677) Support TypeScript merging of export default declarations in template colocation ([@dfreeman](https://github.com/dfreeman))

#### Committers: 2
- Dan Freeman ([@dfreeman](https://github.com/dfreeman))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.6.3 (2021-03-04)

#### :bug: Bug Fix
* [#675](https://github.com/ember-cli/ember-cli-htmlbars/pull/675) Remove development only `optionalDependencies` (`release-it` and `release-it-lerna-changelog`). ([@alexlafroscia](https://github.com/alexlafroscia))

#### Committers: 1
- Alex LaFroscia ([@alexlafroscia](https://github.com/alexlafroscia))


## v5.6.2 (2021-02-27)

#### :bug: Bug Fix
* [#665](https://github.com/ember-cli/ember-cli-htmlbars/pull/665) Ensure AST plugins have the same ordering as < ember-cli-htmlbars@5.5.0. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.6.1 (2021-02-26)

#### :bug: Bug Fix
* [#663](https://github.com/ember-cli/ember-cli-htmlbars/pull/663) Ember Ember 3.27+ can determine global for template compilation ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.6.0 (2021-02-26)

#### :rocket: Enhancement
* [#661](https://github.com/ember-cli/ember-cli-htmlbars/pull/661) Remove usage of registerPlugin / unregisterPlugin ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#662](https://github.com/ember-cli/ember-cli-htmlbars/pull/662) Avoid building the template compiler cache key repeatedly ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.5.0 (2021-02-26)

#### :rocket: Enhancement
* [#660](https://github.com/ember-cli/ember-cli-htmlbars/pull/660) Replace `purgeModule` cache busting with `vm` based sandboxing ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.4.0 (2021-02-24)

#### :house: Internal
* [#659](https://github.com/ember-cli/ember-cli-htmlbars/pull/659) Enable experimentation via `ember-template-imports` addon ([@pzuraq](https://github.com/pzuraq))

#### Committers: 1
- Chris Garrett ([@pzuraq](https://github.com/pzuraq))


## v5.3.2 (2021-02-10)

#### :rocket: Enhancement
* [#657](https://github.com/ember-cli/ember-cli-htmlbars/pull/657) Make cacheKey lazy ([@krisselden](https://github.com/krisselden))

#### Committers: 2
- Kris Selden ([@krisselden](https://github.com/krisselden))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)


## v5.3.1 (2020-08-11)

#### :bug: Bug Fix
* [#599](https://github.com/ember-cli/ember-cli-htmlbars/pull/599) Move `ember-template-lint` to `devDependencies` (from `dependencies`) ([@jamescdavis](https://github.com/jamescdavis))

#### Committers: 1
- James C. Davis ([@jamescdavis](https://github.com/jamescdavis))

## v5.3.0 (2020-08-10)

#### :rocket: Enhancement
* [#597](https://github.com/ember-cli/ember-cli-htmlbars/pull/597) Pass `isProduction` to Ember template compiler. ([@rwjblue](https://github.com/rwjblue))

#### :memo: Documentation
* [#585](https://github.com/ember-cli/ember-cli-htmlbars/pull/585) Refactor README ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#584](https://github.com/ember-cli/ember-cli-htmlbars/pull/584) Replace `ember-cli-template-lint` with `ember-template-lint` ([@arthirm](https://github.com/arthirm))

#### Committers: 2
- Arthi ([@arthirm](https://github.com/arthirm))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.2.0 (2020-06-25)

#### :rocket: Enhancement
* [#527](https://github.com/ember-cli/ember-cli-htmlbars/pull/527) Move template compiler creation to a method on the addon ([@chriseppstein](https://github.com/chriseppstein))

#### Committers: 1
- Chris Eppstein ([@chriseppstein](https://github.com/chriseppstein))


## v5.1.2 (2020-05-08)

#### :bug: Bug Fix
* [#553](https://github.com/ember-cli/ember-cli-htmlbars/pull/553) Ensure custom templateCompilerPath is an absolute path. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.1.1 (2020-05-07)

#### :bug: Bug Fix
* [#551](https://github.com/ember-cli/ember-cli-htmlbars/pull/551) Ensure `EmberENV` is available to inline template compilation ([@rwjblue](https://github.com/rwjblue))
* [#550](https://github.com/ember-cli/ember-cli-htmlbars/pull/550) Fix specifying custom template compiler path. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#547](https://github.com/ember-cli/ember-cli-htmlbars/pull/547) Add some more helpful debug logging to list AST plugins ([@rwjblue](https://github.com/rwjblue))
* [#544](https://github.com/ember-cli/ember-cli-htmlbars/pull/544) Add Node 14 to CI ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.1.0 (2020-05-06)

#### :rocket: Enhancement
* [#543](https://github.com/ember-cli/ember-cli-htmlbars/pull/543) Update babel-plugin-htmlbars-inline-precompile to 4.0.0. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))


## v5.0.0 (2020-05-04)

#### :boom: Breaking Change
* [#496](https://github.com/ember-cli/ember-cli-htmlbars/pull/496) Drop support for Ember < 3.8. ([@rwjblue](https://github.com/rwjblue))
* [#493](https://github.com/ember-cli/ember-cli-htmlbars/pull/493) Drop Node 8 support. ([@rwjblue](https://github.com/rwjblue))
* [#492](https://github.com/ember-cli/ember-cli-htmlbars/pull/492) Remove Bower support. ([@rwjblue](https://github.com/rwjblue))

#### :rocket: Enhancement
* [#528](https://github.com/ember-cli/ember-cli-htmlbars/pull/528) Use smaller cache key for `ember-template-compiler` (reduce overall memory overhead of caching) ([@xg-wang](https://github.com/xg-wang))
* [#512](https://github.com/ember-cli/ember-cli-htmlbars/pull/512) Update Broccoli dependencies to latest. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#514](https://github.com/ember-cli/ember-cli-htmlbars/pull/514) Update fixturify and qunit-dom to latest. ([@rwjblue](https://github.com/rwjblue))
* [#513](https://github.com/ember-cli/ember-cli-htmlbars/pull/513) Update semver to 7.1.2. ([@rwjblue](https://github.com/rwjblue))
* [#508](https://github.com/ember-cli/ember-cli-htmlbars/pull/508) Update to prettier@2. ([@rwjblue](https://github.com/rwjblue))
* [#507](https://github.com/ember-cli/ember-cli-htmlbars/pull/507) Update Babel related devDependencies. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Thomas Wang ([@xg-wang](https://github.com/xg-wang))


## v4.3.1 (2020-04-09)

#### :bug: Bug Fix
* [#494](https://github.com/ember-cli/ember-cli-htmlbars/pull/494) Ensure types file gets published. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.3.0 (2020-04-08)

#### :memo: Documentation
* [#481](https://github.com/ember-cli/ember-cli-htmlbars/pull/481) Add type definition for test helper import ([@chriskrycho](https://github.com/chriskrycho))

#### Committers: 1
- Chris Krycho ([@chriskrycho](https://github.com/chriskrycho))

## v4.2.3 (2020-02-24)

#### :house: Internal
* [#464](https://github.com/ember-cli/ember-cli-htmlbars/pull/464) Remove usage of legacy `checker.forEmber` API. ([@rwjblue](https://github.com/rwjblue))
* [#463](https://github.com/ember-cli/ember-cli-htmlbars/pull/463) fix: Standardize the option name for dependency invalidation. ([@chriseppstein](https://github.com/chriseppstein))

#### Committers: 2
- Chris Eppstein ([@chriseppstein](https://github.com/chriseppstein))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.2.2 (2020-01-15)

#### :bug: Bug Fix
* [#437](https://github.com/ember-cli/ember-cli-htmlbars/pull/437) Revert "Bump semver from 6.3.0 to 7.0.0" ([@rwjblue](https://github.com/rwjblue))

#### :memo: Documentation
* [#425](https://github.com/ember-cli/ember-cli-htmlbars/pull/425) Changelog: Fix wrong version  ([@Turbo87](https://github.com/Turbo87))

#### Committers: 3
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Tobias Bieniek ([@Turbo87](https://github.com/Turbo87))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

## v4.2.1 (2020-01-09)

#### :bug: Bug Fix
* [#423](https://github.com/ember-cli/ember-cli-htmlbars/pull/423) Only check semver range if ember-source is present ([@mixonic](https://github.com/mixonic))
* [#392](https://github.com/ember-cli/ember-cli-htmlbars/pull/392) Ensure inline precompilation does not error when a template contains `*/` ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Matthew Beale ([@mixonic](https://github.com/mixonic))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.2.0 (2019-12-11)

#### :rocket: Enhancement
* [#384](https://github.com/ember-cli/ember-cli-htmlbars/pull/384) Remove `setEdition` requirement for colocation. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.1.1 (2019-12-11)

#### :bug: Bug Fix
* [#390](https://github.com/ember-cli/ember-cli-htmlbars/pull/390) Ensure reexported components do not throw an error. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.1.0 (2019-12-10)

#### :rocket: Enhancement
* [#380](https://github.com/ember-cli/ember-cli-htmlbars/pull/380) Implement basic patching strategy for colocated components. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.9 (2019-12-04)

#### :rocket: Enhancement
* [#373](https://github.com/ember-cli/ember-cli-htmlbars/pull/373) Add co-location support to CoffeeScript component class files ([@locks](https://github.com/locks))

#### :memo: Documentation
* [#351](https://github.com/ember-cli/ember-cli-htmlbars/pull/351) Update Readme with syntax for usage with tagged templates ([@thec0keman](https://github.com/thec0keman))

#### :house: Internal
* [#342](https://github.com/ember-cli/ember-cli-htmlbars/pull/342) Add `ember-octane` test suite run to CI. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 3
- John Ratcliff ([@thec0keman](https://github.com/thec0keman))
- Ricardo Mendes ([@locks](https://github.com/locks))
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.8 (2019-10-19)

#### :bug: Bug Fix
* [#340](https://github.com/ember-cli/ember-cli-htmlbars/pull/340) Fix issues when using colocated component's with decorators. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#341](https://github.com/ember-cli/ember-cli-htmlbars/pull/341) Add test using native classes + decorators. ([@rwjblue](https://github.com/rwjblue))
* [#338](https://github.com/ember-cli/ember-cli-htmlbars/pull/338) Add broccoli plugin + babel plugin colocation tests ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.7 (2019-10-18)

#### :bug: Bug Fix
* [#336](https://github.com/ember-cli/ember-cli-htmlbars/pull/336) Support `as default` exports with template colocation ([@dfreeman](https://github.com/dfreeman))

#### :house: Internal
* [#335](https://github.com/ember-cli/ember-cli-htmlbars/pull/335) Add additional tests for Colocated Components ([@camerondubas](https://github.com/camerondubas))

#### Committers: 2
- Cameron Dubas ([@camerondubas](https://github.com/camerondubas))
- Dan Freeman ([@dfreeman](https://github.com/dfreeman))

## v4.0.6 (2019-10-17)

#### :rocket: Enhancement
* [#334](https://github.com/ember-cli/ember-cli-htmlbars/pull/334) Add parent's name to logging output. ([@rwjblue](https://github.com/rwjblue))

#### :bug: Bug Fix
* [#333](https://github.com/ember-cli/ember-cli-htmlbars/pull/333) Enable colocated component classes to be TypeScript ([@rwjblue](https://github.com/rwjblue))
* [#332](https://github.com/ember-cli/ember-cli-htmlbars/pull/332) Ensure "pods style" templates are compiled properly. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#125](https://github.com/ember-cli/ember-cli-htmlbars/pull/125) Add more tests using AST plugins (inline and standalone) ([@stefanpenner](https://github.com/stefanpenner))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- Stefan Penner ([@stefanpenner](https://github.com/stefanpenner))

## v4.0.5 (2019-10-04)

#### :bug: Bug Fix
* [#324](https://github.com/ember-cli/ember-cli-htmlbars/pull/324) More fixes for proper babel plugin deduplication. ([@rwjblue](https://github.com/rwjblue))

#### :memo: Documentation
* [#323](https://github.com/ember-cli/ember-cli-htmlbars/pull/323) Ensure deprecation message shows correct heirarchy. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.4 (2019-10-02)

#### :bug: Bug Fix
* [#322](https://github.com/ember-cli/ember-cli-htmlbars/pull/322) Fix issue with deduplcation of babel plugin when parallelized ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.3 (2019-10-01)

#### :bug: Bug Fix
* [#317](https://github.com/ember-cli/ember-cli-htmlbars/pull/317) Avoid conflicts with ember-cli-htmlbars-inline-precompile ([@rwjblue](https://github.com/rwjblue))

#### :memo: Documentation
* [#318](https://github.com/ember-cli/ember-cli-htmlbars/pull/318) Ensure all debug logging is emitted with `DEBUG=ember-cli-htmlbars:*` ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

## v4.0.2 (2019-09-30)

#### :bug: Bug Fix
* [#309](https://github.com/ember-cli/ember-cli-htmlbars/pull/309) Ensure inline precompile and colocated templates run template AST plugins. ([@rwjblue](https://github.com/rwjblue))
* [#310](https://github.com/ember-cli/ember-cli-htmlbars/pull/310) Fix issues using inline precompilation with JSON.stringify'ed options. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.1 (2019-09-25)

#### :bug: Bug Fix
* [#304](https://github.com/ember-cli/ember-cli-htmlbars/pull/304) Do nothing in ColocatedTemplateProcessor if input tree is empty. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 1
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))

## v4.0.0 (2019-09-24)

#### :boom: Breaking Change
* [#278](https://github.com/ember-cli/ember-cli-htmlbars/pull/278) Drop Node 6 and 11 support. ([@rwjblue](https://github.com/rwjblue))

#### :rocket: Enhancement
* [#249](https://github.com/ember-cli/ember-cli-htmlbars/pull/249) Initial implementation of co-located templates RFC. ([@rwjblue](https://github.com/rwjblue))
* [#286](https://github.com/ember-cli/ember-cli-htmlbars/pull/286) Implement inline precompilation. ([@rwjblue](https://github.com/rwjblue))

#### :house: Internal
* [#284](https://github.com/ember-cli/ember-cli-htmlbars/pull/284) Move code into `lib/` subdirectory. ([@rwjblue](https://github.com/rwjblue))
* [#283](https://github.com/ember-cli/ember-cli-htmlbars/pull/283) Add prettier setup. ([@rwjblue](https://github.com/rwjblue))
* [#281](https://github.com/ember-cli/ember-cli-htmlbars/pull/281) Add GH Actions CI setup. ([@rwjblue](https://github.com/rwjblue))
* [#279](https://github.com/ember-cli/ember-cli-htmlbars/pull/279) Add tests for Ember 3.4, 3.8, and 3.12. ([@rwjblue](https://github.com/rwjblue))

#### Committers: 2
- Robert Jackson ([@rwjblue](https://github.com/rwjblue))
- [@dependabot-preview[bot]](https://github.com/apps/dependabot-preview)

