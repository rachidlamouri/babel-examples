const uwuifyIdentifier = (identifierNode) => {
  identifierNode.name = identifierNode.name.split('')
    .map((letter) => ['a', 'e', 'i', 'o', 'u'].includes(letter) ? 'uwu' : letter )
    .flat()
    .join('')
}

module.exports = () => ({
  visitor: {
    Identifier(path) {
      switch (path.parent.type) {
        case 'VariableDeclarator':
        case 'BinaryExpression':
        case 'CallExpression':
          uwuifyIdentifier(path.node);
          break;
        case 'MemberExpression':
          if (!['console', 'log', 'name'].includes(path.node.name)) {
            uwuifyIdentifier(path.node);
          }
          break;
        default: throw Error(`Unkown type ${path.parent.type}`);
      }
    },
  },
});
