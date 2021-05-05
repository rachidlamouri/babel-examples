const _ = require('lodash');
const yaml = require('yaml');
const types = require('@babel/types');

const transpileParamsArray = ({
  node,
  paramSchemas,
}) => {
  if (paramSchemas.length !== node.params.length) {
    throw Error(`Received ${paramSchemas.length} parameter schema(s) for ${node.params.length} parameter(s)`);
  }

  if (!paramSchemas.every((schema) => _.isBoolean(schema) || _.isPlainObject(schema) || _.isString(schema))) {
    throw Error('Param schemas must be booleans, objects or string references');
  }

  const hasDestructuredArgs = node.params.some((paramNode) => ['ObjectPattern', 'ArrayPattern'].includes(paramNode.type));
  if (hasDestructuredArgs) {
    throw Error('Destructured parameters with a "params" array is not supported. Use a "params" object');
  }

  return types.arrayExpression(
    paramSchemas.map((paramSchema, index) => {
      const paramName = node.params[index].name;

      return types.arrayExpression([
        types.identifier(paramName),
        _.isBoolean(paramSchema)
          ? types.booleanLiteral(paramSchema)
          : types.valueToNode(paramSchema),
      ]);
    }),
  );
};

const processParamNode = (paramNode) => {
  switch (paramNode.type) {
    case 'Identifier': return paramNode;
    case 'ObjectPattern': return paramNode.properties.map(processParamNode);
    case 'ObjectProperty': return processParamNode(
      paramNode.value.type === 'Identifier'
        ? paramNode.value
        : paramNode.key,
    );
    case 'ArrayPattern': return paramNode.elements.map(processParamNode);
    case 'AssignmentPattern': return processParamNode(paramNode.left);
    case 'RestElement': return processParamNode(paramNode.argument);
    default: throw Error(`Unhandled paramNode type "${paramNode.type}"`);
  }
};

const transpileParamsObject = ({
  node,
  paramSchemas,
}) => {
  const parameterIdentifiers = node.params.map(processParamNode).flat();
  const paramsByName = _.keyBy(parameterIdentifiers, 'name');

  const schemaNames = _.keys(paramSchemas);
  const paramNames = _.keys(paramsByName);

  const missingNames = _.difference(paramNames, schemaNames);
  const extraNames = _.difference(schemaNames, paramNames);

  if (missingNames.length > 0) {
    const formattedNames = missingNames.map((name) => `"${name}"`).join(', ');
    throw Error(`Missing schema(s) for parameter(s): ${formattedNames}`);
  }

  if (extraNames.length > 0) {
    const formattedNames = extraNames.map((name) => `"${name}"`).join(', ');
    throw Error(`Received extra schema(s): ${formattedNames}`);
  }

  return types.objectExpression(
    _(paramSchemas)
      .mapValues((paramSchema, paramName) => types.arrayExpression([
        types.identifier(paramName),
        _.isBoolean(paramSchema)
          ? types.booleanLiteral(paramSchema)
          : types.valueToNode(paramSchema),
      ]))
      .toPairs()
      .map(([paramName, arrayExpression]) => types.objectProperty(
        types.identifier(paramName),
        arrayExpression,
      ))
      .value(),
  );
};

const transpileNode = ({
  node,
  parentNode,
} = {}) => {
  if (node.type !== 'ArrowFunctionExpression') {
    return;
  }

  const commentNode = _.last(parentNode.leadingComments);
  if (!commentNode) {
    return;
  }

  const isJssComment = commentNode.value.startsWith('jss');
  if (!isJssComment) {
    return;
  }

  if (commentNode.type !== 'CommentBlock') {
    throw Error('jss is only valid in a block comment');
  }

  const jssYaml = commentNode.value.replace(/^jss/g, '');
  let schemas;
  try {
    schemas = yaml.parse(jssYaml);
  } catch (error) {
    throw Error(`jss yaml error: ${error.message}`);
  }

  if (schemas.return !== undefined && schemas.resolve !== undefined) {
    throw Error('Expected either a "return" or "resolve" key, but not both');
  }

  const paramSchemas = _.isNull(schemas.params) ? [] : schemas.params;
  const returnsPromise = schemas.resolve !== undefined;
  const returnSchema = returnsPromise ? schemas.resolve : schemas.return;

  if (!_.isArray(paramSchemas) && !_.isPlainObject(paramSchemas)) {
    throw Error('Expected a "params" key of type array, object or null');
  }

  if (_.isUndefined(returnSchema)) {
    throw Error('Expected either a "return" or "resolve" key');
  }

  if (!_.isNull(returnSchema) && !_.isBoolean(returnSchema) && !_.isPlainObject(returnSchema) && !_.isString(returnSchema)) {
    throw Error('Return schema must be null, a boolean, an object or a string reference');
  }

  const nodeCopy = types.cloneNode(node);
  nodeCopy.params = [];

  const callArguments = [
    _.isArray(paramSchemas)
      ? transpileParamsArray({
        node,
        paramSchemas,
      })
      : transpileParamsObject({
        node,
        paramSchemas,
      }),
    _.isBoolean(returnSchema)
      ? types.booleanLiteral(returnSchema)
      : types.valueToNode(returnSchema),
    nodeCopy,
  ];

  if (returnsPromise) {
    callArguments.push(types.valueToNode({ returnsPromise }));
  }

  // eslint-disable-next-line no-param-reassign
  node.body = types.callExpression(
    types.identifier('validate'),
    callArguments,
  );

  // eslint-disable-next-line no-param-reassign
  parentNode.leadingComments = [];
};

module.exports = () => ({
  visitor: {
    ExpressionStatement(path) {
      transpileNode({
        node: path.node.expression,
        parentNode: path.node,
      });
    },
    Property(path) {
      transpileNode({
        node: path.node.value,
        parentNode: path.node,
      });
    },
    VariableDeclaration(path) {
      if (path.node.declarations[0].init === null) {
        return;
      }

      transpileNode({
        node: path.node.declarations[0].init,
        parentNode: path.node,
      });
    },
  },
});
