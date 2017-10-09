# `@wizardsoftheweb/npm-lifecycle-stages`

[![Build Status](https://travis-ci.org/wizardsoftheweb/npm-lifecycle-stages.svg?branch=master)](https://travis-ci.org/wizardsoftheweb/npm-lifecycle-stages) [![Coverage Status](https://coveralls.io/repos/github/wizardsoftheweb/npm-lifecycle-stages/badge.svg?branch=master)](https://coveralls.io/github/wizardsoftheweb/npm-lifecycle-stages?branch=master)

As it turns out, getting programmatic access to NPM's lifecycle stages is [much harder than it sounds](https://blog.wizardsoftheweb.pro/npm-lifecycle-stages-a-study). This package consumes [`npm`](https://www.npmjs.com/package/npm) and exposes all its lifecycle stages as an array of strings (plus a TypeScript enum if you're into that sort of thing).

<!-- MarkdownTOC -->

- [Installation](#installation)
- [Tests](#tests)
- [Usage](#usage)
    - [API](#api)
        - [`NpmLifecycleStages: string[]`](#npmlifecyclestagesstring)
        - [`ENpmLifecycleStages: enum`](#enpmlifecyclestagesenum)
- [Scope?](#scope)
- [Roadmap](#roadmap)
    - [Main Features](#mainfeatures)
    - [Eventual features](#eventualfeatures)

<!-- /MarkdownTOC -->

## Installation

```bash
npm install --save @wizardsoftheweb/npm-lifecycle-stages
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

#### `NpmLifecycleStages: string[]`

This is an array of all lifecycle stages, e.g.
```TypeScript
NpmLifecycleStages.indexOf("poststart") > -1;
```

#### `ENpmLifecycleStages: enum`

This is [an enum](https://www.typescriptlang.org/docs/handbook/enums.html) whose keys are the stages [conveniently initialized](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums) with the stage, e.g.
```TypeScript
ENpmLifecycleStages.stage === "stage";
```

## Scope?

Polluting the global namespace is generally considered a bad idea, so why would you do it on NPM?

## Roadmap

These percentages are pretty arbitrary. Today's 47% could be tomorrow's 90% or vice versa.

### Main Features

I'd like to see this maintain the semver of the upstream repo, so this feature list doesn't mean a whole lot. For the most part, these are things that make it easier to run and update.

| Progess | Feature |
| ------: | ------- |
|    100% | Add build action |
|    100% | Add update action |
|      0% | Figure out cron action |
|      0% | Find a good location for semi-permanent cron execution |
|    100% | Test generated code |
|     -3% | Test build and runner scripts |
|    100% | Export the full namespace |
|    100% | Compile declaration file |
|     70% | Write docs |
|      0% | Publish package on `npm` |

### Eventual features

These are things I'd like to add, but probably won't touch any time soon.

| Progess | Feature |
| ------: | ------- |
|      0% | [Greenkeeper](https://greenkeeper.io/) (or similar) integration |
