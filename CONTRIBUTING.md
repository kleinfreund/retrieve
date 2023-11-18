# Contributing guidelines

Hello there!

This project follows a [code of conduct](https://github.com/kleinfreund/retrieve/blob/main/CODE_OF_CONDUCT.md). Please read it. All contributions are subject to it.

## Prerequisites

The following software will be required to contribute to this project:

- git
- Node.js (version 20.6.1 or higher)
- npm (version 10 or higher)

## Development

### Install dependencies

```sh
npm install
```

### Run tests

```sh
npm test
```

### Build the contents of the `dist` directory

```sh
npm run build
```

### Committing changes

This project follows the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) for naming commits.

**Examples**:

```
feat: adds support for parameter serializer
```

```
fix: interceptors being executed in the wrong order
```

```
docs: expands examples
```

## Pull request guidelines

- In case of submitting a contribution for a new feature, please explain briefly why you think the feature is necessary. Ideally, an issue for a feature request was submitted and approved beforehand, but this is not a requirement.
- Please provide unit tests for feature or bug fix contributions.
