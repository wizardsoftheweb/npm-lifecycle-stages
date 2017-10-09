# `@wizardsoftheweb/npm-lifecycle-stages`

[![Build Status](https://travis-ci.org/wizardsoftheweb/npm-lifecycle-stages.svg?branch=master)](https://travis-ci.org/wizardsoftheweb/npm-lifecycle-stages) [![Coverage Status](https://coveralls.io/repos/github/wizardsoftheweb/npm-lifecycle-stages/badge.svg?branch=master)](https://coveralls.io/github/wizardsoftheweb/npm-lifecycle-stages?branch=master)

<!-- MarkdownTOC -->

- [Installation](#installation)
- [Tests](#tests)
- [Usage](#usage)
    - [API](#api)
    - [Examples](#examples)
- [Scope?](#scope)
- [Roadmap](#roadmap)
    - [Main Features](#mainfeatures)
    - [Eventual features](#eventualfeatures)

<!-- /MarkdownTOC -->


## Installation

```bash
npm install --save-dev @wizardsoftheweb/npm-lifecycle-stages
```

## Tests

In the interest of keeping the final package small, none of the tests are installed. Instead, you'll need to clone the repo.
```bash
git clone https://github.com/wizardsoftheweb/npm-lifecycle-stages.git
cd npm-lifecycle-stages
npm install
npm t
```

## Usage

### API

TODO

### Examples

TODO

## Scope?

Polluting the global namespace is generally considered a bad idea, so why would you do it on NPM?

## Roadmap

These percentages are pretty arbitrary. Today's 47% could be tomorrow's 90% or vice versa.

### Main Features

Once all of these are finished, I'll release `v1`. Until then, `v0` should be used with caution, because it's not stable.

| Progess | Feature |
| ------: | ------- |
|    100% | Add build action |
|    100% | Add update action |
|      0% | Figure out cron action |
|     -3% | Test |
|    100% | Export the full namespace |
|    100% | Compile declaration file |
|      0% | Write docs |
|      0% | Publish package on `npm` |

### Eventual features

These are things I'd like to add, but probably won't be included in `v1`. If not, they'll most likely constitute one or more minor version increments.

| Progess | Feature |
| ------: | ------- |
|      0% | [Greenkeeper](https://greenkeeper.io/) (or similar) integration |
