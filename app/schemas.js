const uuidSchema = {
  type: 'string',
  // pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
  pattern: '^[0-9]{3}$'
};

const uuidListSchema = {
  type: 'array',
  items: uuidSchema,
};

const todoTitleSchema = {
  type: 'string',
  minLength: 4,
};

const todoValueSchema = {
  type: 'integer',
  minimum: 5,
};

const todoSchema = {
  type: 'object',
  properties: {
    title: todoTitleSchema,
    value: todoValueSchema,
  },
  additionalProperties: false,
};

const todoListSchema = {
  type: 'array',
  items: todoSchema,
};

const todosByUserSchema = {
  type: 'object',
  propertyNames: uuidSchema,
  additionalProperties: todoListSchema,
};

module.exports = {
  'base/uuid': uuidSchema,
  'base/uuidList': uuidListSchema,
  'todo/userId': uuidSchema,
  'todo/title': todoTitleSchema,
  'todo/value': todoValueSchema,
  'todo/todo': todoSchema,
  'todo/todoList': todoListSchema,
  'todo/todosByUser': todosByUserSchema,
};
