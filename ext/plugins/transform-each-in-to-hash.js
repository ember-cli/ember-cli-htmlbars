function TransformEachInToHash() {
  // set later within HTMLBars to the syntax package
  this.syntax = null;
}

TransformEachInToHash.prototype.transform = function(ast) {
  var pluginContext = this;
  var walker = new pluginContext.syntax.Walker();
  var b = pluginContext.syntax.builders;

  walker.visit(ast, function(node) {
    if (pluginContext.validate(node)) {
      var removedParams = node.sexpr.params.splice(0, 2);
      var keyword = removedParams[0].original;

      // TODO: This may not be necessary.
      if (!node.sexpr.hash) {
        node.sexpr.hash = b.hash();
      }

      node.sexpr.hash.pairs.push(b.pair(
        'keyword',
        b.string(keyword)
      ));
    }
  });

  return ast;
};

TransformEachInToHash.prototype.validate = function TransformEachInToHash_validate(node) {
  return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') &&
    node.sexpr.path.original === 'each' &&
    node.sexpr.params.length === 3 &&
    node.sexpr.params[1].type === 'PathExpression' &&
    node.sexpr.params[1].original === 'in';
};

module.exports = TransformEachInToHash;
