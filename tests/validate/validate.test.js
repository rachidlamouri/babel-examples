const helpers = require('./helpers');
const { buildValidate } = require('../../validate');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const { expect } = chai;

describe('buildValidate', function () {
  context('without additional schemas', function () {
    it('returns a validate function', function () {
      expect(buildValidate()).to.be.a('function');
    });
  });

  context('with additional schemas', function () {
    it('returns a validate function', function () {
      expect(buildValidate({ 'custom/schema': true })).to.be.a('function');
    });
  });

  context('with a non-object additional schemas', function () {
    it('throws an error', function () {
      const testFn = () => {
        buildValidate(2);
      };

      expect(testFn).to.throw('Non plain object passed to "buildValidate"');
    });
  });

  context('with a schema name with a "jss/" prefix', function () {
    it('throws an error', function () {
      const testFn = () => {
        buildValidate({
          jss: true,
          'jss/schema1': true,
          'namespace1/jss': true,
          'namespace2/jss/schemaA': true,
          'jss/schema2': true,
        });
      };

      expect(testFn).to.throw('Schemas passed to "buildValidate" must not have reserved prefix "jss/". Invalid schemas: ["jss/schema1", "jss/schema2"]');
    });
  });

  context('with invalid schemas', function () {
    it('throws an error', function () {
      const testFn = () => {
        buildValidate({
          schema1: () => {},
          schema2: true,
          schema3: null,
        });
      };

      expect(testFn).to.throw('Schemas passed to "buildValidate" must be booleans or objects. Invalid schemas: ["schema1", "schema3"]');
    });
  });

  context('with a malformed schema', function () {
    it('throws the ajv error with the name of the invalid schema', function () {
      const testFn = () => {
        buildValidate({
          'namespace/schema1': {
            type: ['null', 'null'],
          },
        });
      };

      expect(testFn).to.throw('"namespace/schema1".type should NOT have duplicate items');
    });
  });
});

describe('validate', function () {
  context('when the function has a "return" schema', function () {
    const { nullParamsSchema } = helpers;

    context('and the return value is invalid', function () {
      it('throws the validation error', function () {
        const testFn = () => {
          nullParamsSchema.returnsBadValue();
        };

        expect(testFn).to.throw('return value should be number');
      });
    });

    context('and the return value is a promise', function () {
      it('rejects with a validation error', function () {
        return expect(nullParamsSchema.resolvesForReturnSchema())
          .to.be.rejectedWith('return value should not be a Promise. If a Promise is desired then define a "resolve" schema instead of a "return" schema');
      });
    });

    // regression: was throwing unhandled rejection error for original rejection
    context('and the return value is a rejected promise', function () {
      it('rejects with a validation error', function () {
        return expect(nullParamsSchema.rejectsForReturnSchema())
          .to.be.rejectedWith('return value should not be a Promise. If a Promise is desired then define a "resolve" schema instead of a "return" schema');
      });
    });
  });

  context('when the function has a "return" schema and "params" is an array of schemas', function () {
    const { arrayParamsSchema } = helpers;

    context('and there is one parameter and it is invalid', function () {
      it('throws the validation error', function () {
        const testFn = () => {
          arrayParamsSchema.returnsStringParam(2);
        };

        expect(testFn).to.throw('parameters[0] should be string');
      });
    });

    context('and schema references cannot be resolved', function () {
      it('throws an error with all missing references', function () {
        const testFn = () => {
          arrayParamsSchema.badReferenceForReturn();
        };

        expect(testFn).to.throw('Unknown schema reference "bad_reference1" for "params[0]"\nUnknown schema reference "bad_reference2" for "params[2]"\nUnknown schema reference "bad_reference3" for "return"');
      });
    });

    context('and multiple parameters are invalid', function () {
      it('throws all validation errors', function () {
        const testFn = () => {
          arrayParamsSchema.returnsSum('2', '3');
        };

        expect(testFn).to.throw('parameters[0] should be number\nparameters[1] should be number');
      });
    });

    context('and the parameters and return value are valid', function () {
      it('returns the return value', function () {
        expect(arrayParamsSchema.returnsSum(1, 2)).to.equal(3);
      });
    });
  });

  context('when the function has a "return" schema and "params" is an object with schemas', function () {
    const { objectParamsSchema } = helpers;

    context('and there is one parameter and it is invalid', function () {
      it('throws the validation error', function () {
        const testFn = () => {
          objectParamsSchema.returnsStringParam(2);
        };

        expect(testFn).to.throw('"param1" should be string');
      });
    });

    context('and schema references cannot be resolved', function () {
      it('throws an error with all missing references', function () {
        const testFn = () => {
          objectParamsSchema.badReferenceForReturn();
        };

        expect(testFn).to.throw('Unknown schema reference "bad_reference1" for "param1"\nUnknown schema reference "bad_reference2" for "param3"\nUnknown schema reference "bad_reference3" for "return"');
      });
    });

    context('and multiple parameters are invalid', function () {
      it('throws all validation errors', function () {
        const testFn = () => {
          objectParamsSchema.returnsSum('2', '3');
        };

        expect(testFn).to.throw('"param1" should be number\n"param2" should be number');
      });
    });

    context('and the parameters and return value are valid', function () {
      it('returns the return value', function () {
        expect(objectParamsSchema.returnsSum(1, 2)).to.equal(3);
      });
    });
  });

  context('when the function has a null "return" schema', function () {
    const { nullParamsSchema } = helpers;

    context('and the wrapped function returns undefined', function () {
      it('returns undefined', function () {
        expect(nullParamsSchema.returnsUndefined()).to.be.undefined;
      });
    });

    context('and the wrapped function does not return undefined', function () {
      it('throws a validation error', function () {
        const testFn = () => {
          nullParamsSchema.returnsBadUndefined();
        };

        expect(testFn).to.throw('return value should be undefined');
      });
    });
  });

  context('when the function has a "resolve" schema', function () {
    const { nullParamsSchema } = helpers;

    context('and the returned value is not a promise', function () {
      it('rejects with a validation error', function () {
        return expect(nullParamsSchema.returnsForResolveSchema())
          .to.be.rejectedWith('return value should be Promise');
      });
    });

    context('and the resolved value is invalid', function () {
      it('rejects with the validation error', function () {
        return expect(nullParamsSchema.resolvesBadValue())
          .to.be.rejectedWith('resolved value should be number');
      });
    });
  });

  context('when the function has a "resolve" schema and "params" is an array of schemas', function () {
    const { arrayParamsSchema } = helpers;

    context('and there is one parameter and it is invalid', function () {
      it('rejects with the validation error', function () {
        return expect(arrayParamsSchema.resolvesStringParam(2))
          .to.be.rejectedWith('parameters[0] should be string');
      });
    });

    context('and schema references cannot be resolved', function () {
      it('rejects with an error with all missing references', function () {
        return expect(arrayParamsSchema.badReferenceForResolve())
          .to.eventually.be.rejectedWith('Unknown schema reference "bad_reference1" for "params[0]"\nUnknown schema reference "bad_reference2" for "params[2]"\nUnknown schema reference "bad_reference3" for "resolve"');
      });
    });

    context('and multiple parameters are invalid', function () {
      it('rejects with all validation errors', function () {
        return expect(arrayParamsSchema.resolvesSum('2', '3'))
          .to.be.rejectedWith('parameters[0] should be number\nparameters[1] should be number');
      });
    });

    context('and the parameters and resolved value are valid', function () {
      it('resolves the resolved value', function () {
        return expect(arrayParamsSchema.resolvesSum(1, 2)).to.eventually.equal(3);
      });
    });
  });

  context('when the function has a "resolve" schema and "params" is an object with schemas', function () {
    const { objectParamsSchema } = helpers;

    context('and there is one parameter and it is invalid', function () {
      it('rejects with the validation error', function () {
        return expect(objectParamsSchema.resolvesStringParam(2))
          .to.be.rejectedWith('"param1" should be string');
      });
    });

    context('and schema references cannot be resolved', function () {
      it('rejects with an error with all missing references', function () {
        return expect(objectParamsSchema.badReferenceForResolve())
          .to.eventually.be.rejectedWith('Unknown schema reference "bad_reference1" for "param1"\nUnknown schema reference "bad_reference2" for "param3"\nUnknown schema reference "bad_reference3" for "resolve"');
      });
    });

    context('and multiple parameters are invalid', function () {
      it('rejects with all validation errors', function () {
        return expect(objectParamsSchema.resolvesSum('2', '3'))
          .to.be.rejectedWith('"param1" should be number\n"param2" should be number');
      });
    });

    context('and the parameters and resolved value are valid', function () {
      it('resolves the resolved value', function () {
        return expect(objectParamsSchema.resolvesSum(1, 2)).to.eventually.equal(3);
      });
    });
  });

  context('when the function has a null "resolve" schema', function () {
    const { nullParamsSchema } = helpers;

    context('and the wrapped function resolves with undefined', function () {
      it('resolves with undefined', function () {
        return expect(nullParamsSchema.resolvesUndefined()).to.eventually.be.undefined;
      });
    });

    context('and the wrapped function does not resolve with undefined', function () {
      it('rejects with a validation error', function () {
        return expect(nullParamsSchema.resolvesBadUndefined()).to.be.rejectedWith('resolved value should be undefined');
      });
    });
  });

  context('when the function has custom schemas', function () {
    const { customSchema } = helpers;

    context('and the there are no validation errors', function () {
      it('returns the returned value', function () {
        expect(customSchema.returnsCustomParam('c0eaf5ba-0a87-40cd-b8e0-5e8eddc0780e')).to.equal('c0eaf5ba-0a87-40cd-b8e0-5e8eddc0780e');
      });
    });

    context('and there are validation errors', function () {
      it('throws the errors', function () {
        const testFn = () => {
          customSchema.returnsCustomParam('abcd');
        };

        expect(testFn).to.throw('parameters[0] should match format "uuid"');
      });
    });
  });

  context('when the function is called with more parameters than are defined', function () {
    context('and "params" is an array', function () {
      it('ignores them', function () {
        expect(helpers.arrayParamsSchema.returnsStringParam('a', 'b')).to.equal('a');
      });
    });

    context('and "params" is an object', function () {
      it('ignores them', function () {
        expect(helpers.objectParamsSchema.returnsStringParam('a', 'b')).to.equal('a');
      });
    });
  });
});
