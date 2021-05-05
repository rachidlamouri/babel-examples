const _ = require('lodash');
const Ajv = require('ajv');

var stack;

const getSchemaReferencesErrorMessages = ({
  allSchemas,
  parametersAndSchemas,
  returnSchema,
  returnsPromise,
}) => {
  const schemaReferenceAndAnnotationNameTuples = parametersAndSchemas
    .filter(({ schema }) => _.isString(schema))
    .map(({ schema: schemaReference, schemaName }) => [schemaReference, `"${schemaName}"`]);

  if (_.isString(returnSchema)) {
    schemaReferenceAndAnnotationNameTuples.push([returnSchema, returnsPromise ? '"resolve"' : '"return"']);
  }

  const allErrorMessages = schemaReferenceAndAnnotationNameTuples.reduce(
    (errorMessages, [schemaReference, annotationName]) => {
      if (!_.has(allSchemas, schemaReference)) {
        errorMessages.push(`Unknown schema reference "${schemaReference}" for ${annotationName}`);
      }

      return errorMessages;
    },
    [],
  );

  return allErrorMessages;
};

const getValidationErrorMessage = (schema, value, { ajv }) => {
  const isValid = ajv.validate(schema, value);
  return isValid ? null : ajv.errorsText();
};

const validateReturnValue = (returnedValue, options) => {
  const { returnSchema, returnsPromise } = options;
  const modifier = returnsPromise ? 'resolved value' : 'return value';

  if (returnSchema === null) {
    if (returnedValue === undefined) {
      return;
    }

    console.log(stack);

    throw Error(`${modifier} should be undefined`);
  }

  const errorMessage = getValidationErrorMessage(returnSchema, returnedValue, options);
  if (errorMessage) {
    console.log(stack);
    const modifiedMessage = errorMessage.replace(/data/g, modifier);
    throw Error(modifiedMessage);
  }
};

module.exports.buildValidate = (additionalSchemas = {}) => {
  if (!_.isPlainObject(additionalSchemas)) {
    throw Error('Non plain object passed to "buildValidate"');
  }

  {
    const invalidSchemaNames = _(additionalSchemas)
      .pickBy((schema, name) => name.startsWith('jss/'))
      .map((schema, name) => `"${name}"`)
      .join(', ');

    if (!_.isEmpty(invalidSchemaNames)) {
      throw Error(`Schemas passed to "buildValidate" must not have reserved prefix "jss/". Invalid schemas: [${invalidSchemaNames}]`);
    }
  }

  {
    const invalidSchemaNames = _(additionalSchemas)
      .pickBy((schema) => !_.isPlainObject(schema) && !_.isBoolean(schema))
      .map((schema, name) => `"${name}"`)
      .join(', ');

    if (!_.isEmpty(invalidSchemaNames)) {
      throw Error(`Schemas passed to "buildValidate" must be booleans or objects. Invalid schemas: [${invalidSchemaNames}]`);
    }
  }

  const ajv = new Ajv();
  const jssSchemas = {
    'jss/array': { type: 'array' },
    'jss/boolean': { type: 'boolean' },
    'jss/integer': { type: 'integer' },
    'jss/null': { type: 'null' },
    'jss/number': { type: 'number' },
    'jss/object': { type: 'object' },
    'jss/string': { type: 'string' },
  };

  const allSchemas = {
    ...additionalSchemas,
    ...jssSchemas,
  };

  _.forEach(allSchemas, (schema, name) => {
    try {
      ajv.addSchema(schema, name);
    } catch (error) {
      const message = error.message.replace(/data/g, `"${name}"`);
      throw Error(message);
    }
  });

  const validate = (parameterAndSchemaTuples, returnSchema, wrappedFunction, { returnsPromise = false } = {}) => {
    stack = new Error('Original Stack Trace').stack;

    const parametersAndSchemas = _.isArray(parameterAndSchemaTuples)
      ? parameterAndSchemaTuples.map(([parameter, schema], index) => ({
        parameter,
        schema,
        schemaName: `params[${index}]`,
        parameterName: `parameters[${index}]`,
      }))
      : _.entries(parameterAndSchemaTuples).map(([schemaName, [parameter, schema]]) => ({
        parameter,
        schema,
        schemaName,
        parameterName: `"${schemaName}"`,
      }));


    const options = {
      ajv,
      allSchemas,
      parametersAndSchemas,
      returnSchema,
      wrappedFunction,
      returnsPromise,
    };

    const referenceErrorMessages = getSchemaReferencesErrorMessages(options);
    if (referenceErrorMessages.length > 0) {
      const errorMessage = referenceErrorMessages.join('\n');

      if (returnsPromise) {
        return Promise.reject(Error(errorMessage));
      }

      throw Error(errorMessage);
    }

    const parameterErrorMessages = parametersAndSchemas.reduce(
      (errorMessages, { parameter, schema, parameterName }) => {
        const errorMessage = getValidationErrorMessage(schema, parameter, options);

        if (errorMessage) {
          const modifiedMessage = errorMessage.replace(/data/g, parameterName);
          errorMessages.push(modifiedMessage);
        }

        return errorMessages;
      },
      [],
    );

    if (parameterErrorMessages.length > 0) {
      const errorMessage = parameterErrorMessages.join('\n');

      if (returnsPromise) {
        return Promise.reject(Error(errorMessage));
      }

      throw Error(errorMessage);
    }

    const returnedValue = wrappedFunction();

    if (returnsPromise) {
      if (!(returnedValue instanceof Promise)) {
        return Promise.reject(Error('return value should be Promise'));
      }

      return returnedValue.then((resolvedValue) => {
        validateReturnValue(resolvedValue, options);
        return resolvedValue;
      });
    }

    if (returnedValue instanceof Promise) {
      return returnedValue
        .finally(() => {
          throw Error('return value should not be a Promise. If a Promise is desired then define a "resolve" schema instead of a "return" schema');
        });
    }

    validateReturnValue(returnedValue, options);
    return returnedValue;
  };

  return validate;
};
