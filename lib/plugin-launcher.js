module.exports = function (params) {
  return require(params.requireFile)[params.buildUsing](params.params).plugin;
};
