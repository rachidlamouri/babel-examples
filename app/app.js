global.validate = require('../validate').buildValidate(require('./schemas'));
const { Command } = require('commander');
const businessLogic = require('./businessLogic');
const logAndExit = (error) => {
  console.log(error);
  process.exit(1);
};

const program = new Command('npm run app');

program.command('list-users')
  .action((...args) => (
    businessLogic.listUsers(...args)
      .catch(logAndExit)
  ));

program.command('list-todos <userId>')
  .action((...args) => (
    businessLogic.listTodos(...args)
    .catch(logAndExit)
  ));

program.command('add-user <userId>')
  .action((...args) => (
    businessLogic.addUser(...args)
    .catch(logAndExit)
  ));

program.command('add-todo <userId> <title> <value>')
  .action((userId, title, value) => (
    businessLogic.addTodo(userId, title, parseInt(value, 10))
      .catch(logAndExit)
  ));

program.parse();
