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

