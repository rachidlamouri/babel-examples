const _ = require('lodash');
const { expect } = require('chai');
const pluginTester = require('babel-plugin-tester').default;
const plugin = require('../../plugins/jssPlugin');

const testScenario = (scenario, { only = false, ...tests } = {}) => pluginTester({
  pluginName: scenario,
  plugin,
  tests: only
    ? _.mapValues(tests, (test) => ({ only, ...test }))
    : tests,
});

const buildValidateError = (expectedMessage) => (error) => {
  // error message starts with "unknown: ", this is probably not the best way to handle this
  const [, errorMessage] = error.message.split('unknown: ');

  expect(errorMessage).to.equal(expectedMessage);
  return true;
};

describe('json-schema-script', function () {
  testScenario('ExpresssionStatement | no function', {
    'ignores expressions without functions': {
      code: '("");',
      output: '"";',
    },
  });

  testScenario('ExpressionStatement | ArrowFunctionExpression | no jss', {
    'ignores a function without a comment': {
      code: '() => {};',
    },
    'ignores a function with a line comment': {
      code: `
        // oh hello!
        () => {};
      `,
    },
    'ignores a function with a yaml block comment': {
      code: `
        /*
          params:
          return:
        */
        () => {};
      `,
    },
    'throws an error for a function with a jss line comment': {
      code: `
        //jss
        () => {};
      `,
      error: buildValidateError('jss is only valid in a block comment'),
    },
  });

  testScenario('ExpressionStatement | ArrowFunctionExpression | jss comment', {
    'throws a modified error for malformed yaml': {
      code: `
        /*jss
          params: [
        */
        () => {};
      `,
      error: buildValidateError('jss yaml error: Insufficient indentation in flow collection'),
    },
    'throws an error for a non-array, non-object "params"': {
      code: `
        /*jss
          params: 2
          return:
        */
        () => {};
      `,
      error: buildValidateError('Expected a "params" key of type array, object or null'),
    },
    'transpiles a function with a null "params" and "return" keys': {
      code: `
        /*jss
          params:
          return:
        */
        () => {};
      `,
      output: `
        () => validate([], null, () => {});
      `,
    },
    'transpiles a function with a null "params" and "resolve" keys': {
      code: `
        /*jss
          params:
          resolve:
        */
        () => {};
      `,
      output: `
        () =>
          validate([], null, () => {}, {
            returnsPromise: true,
          });
      `,
    },
    'preserves the function body': {
      code: `
        /*jss
          params:
          return:
        */
        () => {
          const a = 2;
          const b = 3;
          return a + b;
        };
      `,
      output: `
        () =>
          validate([], null, () => {
            const a = 2;
            const b = 3;
            return a + b;
          });
      `,
    },
  });

  testScenario('ExpressionStatement | ArrowFunctionExpression | jss comment | params array', {
    'transpiles a function without params': {
      code: `
        /*jss
          params: []
          return:
        */
        () => {};
      `,
      output: `
        () => validate([], null, () => {});
      `,
    },
    'transpiles a function with boolean schemas': {
      code: `
        /*jss
          params:
            - true
            - true
          return: true
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            [
              [param1, true],
              [param2, true],
            ],
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with object schemas': {
      code: `
        /*jss
          params:
            - type: string
            - type: number
          return:
            type: boolean
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            [
              [
                param1,
                {
                  type: "string",
                },
              ],
              [
                param2,
                {
                  type: "number",
                },
              ],
            ],
            {
              type: "boolean",
            },
            () => {}
          );
      `,
    },
    'transpiles a function with schema string references': {
      code: `
        /*jss
          params:
            - testReferenceName1
            - testReferenceName2
          return: testReferenceName3
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            [
              [param1, "testReferenceName1"],
              [param2, "testReferenceName2"],
            ],
            "testReferenceName3",
            () => {}
          );
      `,
    },
  });

  testScenario('ExpressionStatement | ArrowFunctionExpression | jss comment | params object', {
    'transpiles a function without params': {
      code: `
        /*jss
          params: {}
          return:
        */
        () => {};
      `,
      output: `
        () => validate({}, null, () => {});
      `,
    },
    'transpiles a function with boolean schemas': {
      code: `
        /*jss
          params:
            param1: true
            param2: true
          return: true
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            {
              param1: [param1, true],
              param2: [param2, true],
            },
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with object schemas': {
      code: `
        /*jss
          params:
            param1: { type: string }
            param2: { type: number }
          return:
            type: boolean
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            {
              param1: [
                param1,
                {
                  type: "string",
                },
              ],
              param2: [
                param2,
                {
                  type: "number",
                },
              ],
            },
            {
              type: "boolean",
            },
            () => {}
          );
      `,
    },
    'transpiles a function with schema string references': {
      code: `
        /*jss
          params:
            param1: testReferenceName1
            param2: testReferenceName2
          return: testReferenceName3
        */
        (param1, param2) => {};
      `,
      output: `
        (param1, param2) =>
          validate(
            {
              param1: [param1, "testReferenceName1"],
              param2: [param2, "testReferenceName2"],
            },
            "testReferenceName3",
            () => {}
          );
      `,
    },
    'transpiles a function with destructured parameters': {
      code: `
        /*jss
          params:
            param1: reference1
            param2: reference2
            param3: reference3
            param4: reference4
          return: true
        */
        ({ param1, param2 }, [param3, param4]) => {};
      `,
      output: `
        ({ param1, param2 }, [param3, param4]) =>
          validate(
            {
              param1: [param1, "reference1"],
              param2: [param2, "reference2"],
              param3: [param3, "reference3"],
              param4: [param4, "reference4"],
            },
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with parameters with defaults': {
      code: `
        /*jss
          params:
            param1: reference1
            param2: reference2
            param3: reference3
          return: true
        */
        (param1 = 1, { param2 = 2 }, [param3 = 3]) => {};
      `,
      output: `
        (param1 = 1, { param2 = 2 }, [param3 = 3]) =>
          validate(
            {
              param1: [param1, "reference1"],
              param2: [param2, "reference2"],
              param3: [param3, "reference3"],
            },
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with defaulted destructured parameters': {
      code: `
        /*jss
          params:
            param1: reference1
            param2: reference2
          return: true
        */
        ({ param1 } = {}, [param2] = []) => {};
      `,
      output: `
        ({ param1 } = {}, [param2] = []) =>
          validate(
            {
              param1: [param1, "reference1"],
              param2: [param2, "reference2"],
            },
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with renamed destructured parameters': {
      code: `
        /*jss
          params:
            param2: reference1
          return: true
        */
        ({ param1: param2 }) => {};
      `,
      output: `
        ({ param1: param2 }) =>
          validate(
            {
              param2: [param2, "reference1"],
            },
            true,
            () => {}
          );
      `,
    },
    'transpiles a function with a destructured object parameter with a rest identifier': {
      code: `
        /*jss
          params:
            param1: reference1
          return: true
        */
        ({ ...param1 }) => {};
      `,
      output: `
        ({ ...param1 }) =>
          validate(
            {
              param1: [param1, "reference1"],
            },
            true,
            () => {}
          );
      `,
    },
  });

  testScenario('errors', {
    'throws an error when "params" key is missing': {
      code: `
        /*jss
          return:
        */
        () => {};
      `,
      error: buildValidateError('Expected a "params" key of type array, object or null'),
    },
    'throws an error when "return" and "resolve" keys are missing': {
      code: `
        /*jss
          params:
        */
        () => {};
      `,
      error: buildValidateError('Expected either a "return" or "resolve" key'),
    },
    'throws an error when both "return" and "resolve" keys are provided': {
      code: `
        /*jss
          params:
          return:
          resolve:
        */
        () => {};
      `,
      error: buildValidateError('Expected either a "return" or "resolve" key, but not both'),
    },
    'throws an error when the return schema is invalid': {
      code: `
        /*jss
          params:
          return: 2
        */
        () => {};
      `,
      error: buildValidateError('Return schema must be null, a boolean, an object or a string reference'),
    },
  });

  testScenario('errors | params array', {
    'throws an error when the schema count is less than the parameter count': {
      code: `
        /*jss
          params:
            - true
          return:
        */
        (param1, param2) => {};
      `,
      error: buildValidateError('Received 1 parameter schema(s) for 2 parameter(s)'),
    },
    'throws an error when the schema count is greater than the parameter count': {
      code: `
        /*jss
          params:
            - true
            - true
          return:
        */
        (param1) => {};
      `,
      error: buildValidateError('Received 2 parameter schema(s) for 1 parameter(s)'),
    },
    'throws an error when a parameter schema is invalid': {
      code: `
        /*jss
          params: [2]
          return:
        */
        (param1) => {};
      `,
      error: buildValidateError('Param schemas must be booleans, objects or string references'),
    },
    'throws an error when a parameter is destructured': {
      code: `
        /*jss
          params:
            - true
            - true
          return: testReferenceName3
        */
        ({ param1 }, { param2 }) => {};
      `,
      error: buildValidateError('Destructured parameters with a "params" array is not supported. Use a "params" object'),
    },
  });

  testScenario('errors | params object', {
    'throws an error when "params" is missing a schema': {
      code: `
        /*jss
          params:
            param2: true
          return:
        */
        (param1, param2, param3) => {};
      `,
      error: buildValidateError('Missing schema(s) for parameter(s): "param1", "param3"'),
    },
    'throws an error when "params" has extra keys': {
      code: `
        /*jss
          params:
            param1: true
            param2: true
            param3: true
          return:
        */
        (param2) => {};
      `,
      error: buildValidateError('Received extra schema(s): "param1", "param3"'),
    },
    'throws an error when a parameter schema is invalid': {
      code: `
        /*jss
          params: [2]
          return:
        */
        (param1) => {};
      `,
      error: buildValidateError('Param schemas must be booleans, objects or string references'),
    },
  });

  testScenario('nested functions', {
    'preserves nested functions without schema comments': {
      code: `
        /*jss
          params:
          return:
        */
        () => {
          (param1, param2) => {};
        };
      `,
      output: `
        () =>
          validate([], null, () => {
            (param1, param2) => {};
          });
      `,
    },
    'transpiles nested functions with schema comments': {
      code: `
        /*jss
          params:
          return:
        */
        () => {
          /*jss
            params:
            return:
          */
          () => {};
        };
      `,
      output: `
        () =>
          validate([], null, () => {
            () => validate([], null, () => {});
          });
      `,
    },
  });

  testScenario('ObjectExpression | Property', {
    'transpiles an arrow function for an object property': {
      code: `
        ({
          /*jss
            params:
              - true
              - true
            return:
              true
          */
          property: (param1, param2) => {},
        });
      `,
      output: `
        ({
          property: (param1, param2) =>
            validate(
              [
                [param1, true],
                [param2, true],
              ],
              true,
              () => {}
            ),
        });
      `,
    },
  });

  testScenario('VariableDeclaration | VariableDeclarator | ArrowFunctionExpression', {
    'transpiles an arrow function in a variable declaration': {
      code: `
        /*jss
          params:
            - true
            - true
          return:
            true
        */
        const variable = (param1, param2) => {};
      `,
      output: `
        const variable = (param1, param2) =>
          validate(
            [
              [param1, true],
              [param2, true],
            ],
            true,
            () => {}
          );
      `,
    },
  });

  testScenario('VariableDeclaration | no function', {
    'ignores a "let" without an assignment': {
      code: 'let foo;',
      output: 'let foo;',
    },
    'ignores a "let" with a non function assignment': {
      code: 'let foo = 2;',
      output: 'let foo = 2;',
    },
  });
});
