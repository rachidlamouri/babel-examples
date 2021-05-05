const fileHandler = require('./fileHandler');

module.exports = {
  /*jss
    params:
    resolve: todo/todosByUser
  */
  get: () => fileHandler.read(),

  /*jss
    params: [true]
    resolve:
  */
  modify: (callback) => {
    /*jss
      params:
        todosByUser: todo/todosByUser
      resolve:
    */
    const saveMutatedData = (todosByUser) => fileHandler.write(todosByUser)

    return fileHandler.read()
      .then((todosByUser) => {
        callback(todosByUser);
        return todosByUser;
      })
      .then(saveMutatedData)
  },
};
