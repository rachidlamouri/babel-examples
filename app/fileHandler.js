const fs = require('fs')
const filepath = './app/todos.json';

module.exports = {
  /*jss
    params:
    resolve: jss/object
  */
  read: () => new Promise((resolve) => {
    fs.readFile(filepath, 'utf8', (error, file) => {
      const data = JSON.parse(file);
      resolve(data);
    });
  }),

  /*jss
    params:
      data: jss/object
    resolve:
  */
  write: (data) => new Promise((resolve) => {
    fs.writeFile(filepath, JSON.stringify(data, null, 2), () => {
      resolve();
    });
  }),
};
