# express-passport-mongo-lit

A fullstack starter for little projects requiring authentication and user management. Based on [express](https://expressjs.com), [passport](https://www.passportjs.org/), [mongodb](https://mongodb.com/) and [lit](https://lit.dev/), automatically packed into a [docker](https://www.docker.com/) container using a [github action](https://github.com/features/actions).  

The frontend was generated using [npm init @open-wc](https://github.com/open-wc/create).

The backend was generated using [npx express-generator](https://github.com/expressjs/generator).

During the docker build, the frontend build is copied from frontend/dist to backend/public, from where express serves static files. The backend is then wrapped up into the official lts-slim node image from [dockerhub](https://hub.docker.com/_/node). If used in a docker container, the following environmental parameters are available:

* ADMIN_USERNAME (only changed **if no admin exists in the database yet**, defaults to "admin")
* ADMIN_PASSWORD (only changed **if no admin exists in the database yet**, defaults to "admin")
* SESSION_SECRET (Using a secret that cannot be guessed will reduce the ability to hijack a session, see [here](http://expressjs.com/en/resources/middleware/session.html))

For development, use the following commands in the top level folder
```
docker compose up -d
```
This will run a mongodb container your backend can interact with.
```
npm run cleaninstall
```
This will install all required packages in the backend and frontend folder.
```
npm run init
```
This will create a development database in the db folder with one admin (password "admin") and one user (password "user").
```
npm start
```
This will serve the frontend using [@web/dev-server](https://modern-web.dev/docs/dev-server/overview/) on port 8000 and the backend using [nodemon](https://nodemon.io/) on port 3000, both watching for file changes and restarting the backend or reloading the web page on every file change. The frontend dev-server is configured to forward all calls to /api/ to the backend port.

All this is configured on Linux, I am sure you need several changes in the package.json files for development on Windows.
