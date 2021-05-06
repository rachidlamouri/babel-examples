# Babel Examples

## Installation

```bash
# install dependencies
npm ci
```

## Cleanup

```bash
# removes all *-output folders
npm run clean
```

## No Change Example

```bash
# build no-change example
npm run build:simple

# 1) compare source code and output
node simple-input/
node simple-outuput/
```

## Es6 -> Es5 Example

```bash
# build es6->es5 example
npm run build:es6

# 1) compare source code and output
node es6-input/
node es6-outuput/
```

## Replace Identifiers Example

```bash
# build replace-identifiers example
npm run build:uwu

# 1) compare source code and output
node uwu-input/
node uwu-outuput/
```

## Data App Example

### Using the App

```bash
# transpiles app code using the jss plugin
npm run build:app

# lists users in ./app/todos.json
npm run app list-users

# adds user to ./app/todos.json
# userId is a 3 digit number
npm run app add-user <userId>

# lists user's todos from ./app/todos.json
# userId is a 3 digit number
npm run app list-todos <userId>

# Adds a todo for the user to ./app/todos.json
# userId is a 3 digit number
# title is a string with at least 4 characters
# value is an integer greater than 4
npm run app add-todo <userId> <title> <value>
```

### Developing the App

```bash
# build in watch mode so src changes are automatically reflected in output
npm run build:app -- --watch

# 1) modify any js file in ./app/
# 2) modify ./app/schemas.js (you might need to reset ./app/todos.json to an empty object)
```

### Running Jss Plugin Tests

```bash
# jss plugin can be tested without transpilation
npm run test:jss-plugin
```

### Running Jss Validate Tests

```bash
# jss validate tests must be transpiled first
npm run build:jss-validate-tests

npm run test:jss-validate
```
