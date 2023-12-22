module.exports = function (params) {
  let fn = require(params.requireFile)[params.buildUsing];
  return fn(params.params).plugin;
};
