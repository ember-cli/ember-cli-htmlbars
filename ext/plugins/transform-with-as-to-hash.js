function TransformWithAsToHash() {
  // set later within HTMLBars to the syntax package
  this.syntax = null;
}

TransformWithAsToHash.prototype.transform = function TransformWithAsToHash_transform(ast) {
  var pluginContext = this;
  var walker = new pluginContext.syntax.Walker();
  var b = pluginContext.syntax.builders;

  walker.visit(ast, function(node) {
    if (pluginContext.validate(node)) {
      var removedParams = node.sexpr.params.splice(1, 2);
      var keyword = removedParams[1].original;

      // TODO: This may not be necessary.
      if (!node.sexpr.hash) {
        node.sexpr.hash = b.hash();
      }

      node.sexpr.hash.pairs.push(b.pair(
        'keywordName',
        b.string(keyword)
      ));
    }
  });

  return ast;
};

TransformWithAsToHash.prototype.validate = function TransformWithAsToHash_validate(node) {
  return node.type === 'BlockStatement' &&
    node.sexpr.path.original === 'with' &&
    node.sexpr.params.length === 3 &&
    node.sexpr.params[1].type === 'PathExpression' &&
    node.sexpr.params[1].original === 'as';
};

module.exports = TransformWithAsToHash;
