const dataHandler = require('./dataHandler');

const businessLogic = {
  /*jss
    params:
    resolve:
  */
  listUsers: () => {
    /*jss
      params:
        todosByUser: todo/todosByUser
      return: base/uuidList
    */
    const extractUsers = (todosByUser) => Object.keys(todosByUser);

    /*jss
      params:
        userIds: base/uuidList
      return:
    */
    const logUsers = (userIds) => {
      console.log('Users:', JSON.stringify(userIds, null, 2));
    };

    return dataHandler.get()
      .then(extractUsers)
      .then(logUsers);
  },

  /*jss
    params:
      userId: todo/userId
    resolve:
  */
  addUser: (userId) => {
    /*jss
      params:
        todosByUser: todo/todosByUser
      return:
    */
    const appendUser = (todosByUser) => {
      if (!(userId in todosByUser)) {
        todosByUser[userId] = [];
      }
    };

    return dataHandler.modify(appendUser)
      .then(() => businessLogic.listUsers());
  },

  /*jss
    params:
      userId: todo/userId
    resolve:
  */
  listTodos: (userId) => {
    /*jss
      params:
        todosByUser: todo/todosByUser
      return:
    */
    const logUserTodos = (todosByUser) => {
      console.log('Todos:', JSON.stringify(todosByUser[userId], null, 2));
    };

    return dataHandler.get()
      .then(logUserTodos);
  },

  /*jss
    params:
      userId: todo/userId
      title: todo/title
      value: todo/value
    resolve:
  */
  addTodo: (userId, title, value) => {
    /*jss
      params:
        todosByUser: todo/todosByUser
      return:
    */
    const appendTodoToUser = (todosByUser) => {
      if (!(userId in todosByUser)) {
        throw Error(`User ${userId} does not exist`);
      }

      todosByUser[userId].push({
        title,
        value,
      });
    };

    return dataHandler.modify(appendTodoToUser)
      .then(() => businessLogic.listTodos(userId));
  },
};

module.exports = businessLogic;
