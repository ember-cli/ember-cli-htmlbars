var Walker = require('htmlbars').Walker;

module.exports = function(ast) {
  var walker = new Walker();

  walker.visit(ast, function(node) {
    if (validate(node)) {
      var removedParams = node.sexpr.params.splice(0, 2);
      var keyword = removedParams[0].original;
      var stringNode = {
        type: 'StringLiteral',
        value: keyword,
        original: keyword
      };

      if (!node.sexpr.hash) {
        node.sexpr.hash = {
          type: 'Hash',
          pairs: []
        };
      }

      var hashPair = {
        type: 'HashPair',
        key: 'keyword',
        value: stringNode
      };

      node.sexpr.hash.pairs.push(hashPair);
    }
  });

  return ast;
}

function validate(node) {
  return (node.type === 'BlockStatement' || node.type === 'MustacheStatement') &&
    node.sexpr.path.original === 'each' &&
    node.sexpr.params.length === 3 &&
    node.sexpr.params[1].type === 'PathExpression' &&
    node.sexpr.params[1].original === 'in';
}
