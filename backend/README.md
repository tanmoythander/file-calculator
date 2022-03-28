# Butterfly - Backend

#### Secure REST API cross-platfrom server with Nodejs, Express, mongoose & JsonWebToken

## Installing on local machine

#### Please make sure you have node.js installed on your machine

If you don't have, [click here...](https://nodejs.org/)

### 1. check if you have it installed or not,

    npm -v

and,

    node -v

you should see some version info in return.

### 2. Clone repository

Go to the directory where you want to place the project files using git bash (terminal for mac)

run the command

    git clone URL

Please note that you need to authenticate to clone this private repository.

### 3. Install dependencies

now navigate to the project directory with cmd (terminal for mac)
run the command

    npm install

wait for it to be completed. It usually takes a minute or less to complete.
It will download all the dependencies.

### 4. Now run the command

    npm start

or,

    node app.js

It will serve the project on default port (6259).

## Developer Hint

### Please change your editor configuration like below before you start development

#### Indent character: "\t" (tab)

#### Indent size: 2

#### Line endings: LF (unix)

It's good to remember that, **./app.js** is the entry point to the app.

### Install the global packages

run the command on any directory

    npm install -g nodemon apidoc eslint

wait for it to be completed. It usually takes a minute or less to complete.
You might need to mention `sudo` in few cases.

### Watch files while editing source

run the command

    npm run dev

It will serve the project. On any file saved, the app will be restarted and linted.

### Build apidoc

run the command

    npm run apidoc

It will build the apidoc in the directory **./apidoc**.

### Lint source

run the command

    npm run eslint

It will show warnings and errors if there is any formatting issue. In case of no formatting issue, it will show nothing.

## Versioning Guide

This project follows the [Schemantic Versioning](https://semver.org/) rules where the version numbers must be integers. For example, we will use 1.2.3 as version in the commands below.

- Make sure your branch is up to date,

      git fetch origin
      git pull origin develop

- **Replace** old version (lets say 1.2.2) with 1.2.3 in the following files using **Find and Replace** and **commit** the changes,

      /apidoc.json
      /routes/admin.js
      /routes/public.js
      /routes/token.js
      /routes/user.js

- Run the following command and **commit** the changes

      npm run apidoc

- Finally run this,

      npm version 1.2.3 && git push

## Updating nodejs using nvm with PM2
While updating PM2 it is good idea to update nodejs also if possible and vice versa.

- Check current version

		node -v
	Lets say the old version is, `14.16.1` and we are going to install `14.17.3`

- Check if there is any issue with existing global packages (Recommended for macos)

		npm list -g --depth 0
	Fix the issues if there is any and execute the command again to check again

- Install new version and reinstall old packages

		nvm install 14.17.3 --reinstall-packages-from=14.16.1

- Set the new version as default

		nvm alias default 14.17.3

- Update PM2 (Optional)

		npm i -g pm2@latest
		pm2 save
		pm2 update

- Remove the old node version (Optional)

		rm -rf ~/.nvm/versions/node/v14.16.1
