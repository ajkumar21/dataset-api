## Description

A REST API for retrieving asset pricing data from the Coincap API. This backend service uses NestJS, Typescript and Sequelize.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker

```bash
# to run in docker
$ docker-compose up
```

NOTE: There needs to be atleast one ops user in the DB in order to sign up other ops users. Easiest way to do this is by signing a user up as a quant user and then manually changing the role in the db to ops for that specific user. As this is an MVP, I left it like this, but in the longer term there would have been a seperate admin service to allocate ops users.
