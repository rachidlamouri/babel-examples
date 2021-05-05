/* eslint-disable no-unused-vars */
const { buildValidate } = require('../../validate');

// eslint-disable-next-line no-unused-vars
const validate = buildValidate({
  'custom/uuid': {
    type: 'string',
    format: 'uuid',
  },
});

module.exports = {
  nullParamsSchema: {
    /*jss
        params:
        return:
          type: number
      */
    returnsBadValue: () => 'test',
    /*jss
      params:
      resolve:
        type: number
    */
    resolvesBadValue: () => Promise.resolve('test'),
    /*jss
      params:
      return:
    */
    returnsUndefined: () => undefined,
    /*jss
      params:
      return:
    */
    returnsBadUndefined: () => 2,
    /*jss
      params:
      resolve:
    */
    resolvesUndefined: () => Promise.resolve(),
    /*jss
      params:
      resolve:
    */
    resolvesBadUndefined: () => Promise.resolve(2),
    /*jss
      params:
      return:
      */
    resolvesForReturnSchema: () => Promise.resolve(),
    /*jss
      params:
      return:
    */
    rejectsForReturnSchema: () => Promise.reject(Error('original error')),
    /*jss
      params:
      resolve:
      */
    returnsForResolveSchema: () => undefined,
  },
  arrayParamsSchema: {
    /*jss
        params:
          - type: string
        return:
          type: string
      */
    returnsStringParam: (param1) => param1,
    /*jss
      params:
        - type: string
      resolve:
        type: string
    */
    resolvesStringParam: (param1) => Promise.resolve(param1),
    /*jss
      params: [bad_reference1, jss/number, bad_reference2]
      return: bad_reference3
    */
    badReferenceForReturn: (param1, param2, param3) => {},
    /*jss
      params: [bad_reference1, jss/number, bad_reference2]
      resolve: bad_reference3
    */
    badReferenceForResolve: (param1, param2, param3) => Promise.resolve(),
    /*jss
      params:
        - type: number
        - jss/number
      return:
        jss/number
    */
    returnsSum: (param1, param2) => param1 + param2,
    /*jss
      params:
        - type: number
        - jss/number
      resolve:
        jss/number
    */
    resolvesSum: (param1, param2) => Promise.resolve(param1 + param2),
  },
  objectParamsSchema: {
    /*jss
      params:
        param1: { type: string }
      return:
        type: string
    */
    returnsStringParam: (param1) => param1,
    /*jss
      params:
        param1: { type: string }
      resolve:
        type: string
    */
    resolvesStringParam: (param1) => Promise.resolve(param1),
    /*jss
      params:
        param1: bad_reference1
        param2: jss/number
        param3: bad_reference2
      return: bad_reference3
    */
    badReferenceForReturn: (param1, param2, param3) => {},
    /*jss
      params:
        param1: bad_reference1
        param2: jss/number
        param3: bad_reference2
      resolve: bad_reference3
    */
    badReferenceForResolve: (param1, param2, param3) => Promise.resolve(),
    /*jss
      params:
        param1: { type: number }
        param2: jss/number
      return:
        jss/number
    */
    returnsSum: (param1, param2) => param1 + param2,
    /*jss
      params:
        param1: { type: number }
        param2: jss/number
      resolve:
        jss/number
    */
    resolvesSum: (param1, param2) => Promise.resolve(param1 + param2),
  },
  customSchema: {
    /*jss
      params:
        - custom/uuid
      return: custom/uuid
    */
    returnsCustomParam: (param1) => param1,
  },
};
