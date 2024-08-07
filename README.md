# Cognitive engine UI

The Cognitive Engine UI is a frontend module for managing machine learning models and their life cycles within the cognitive framework. 
This application allows users to track, train, and experiment with different models, parameters, and datasets.

## Prerequisites

Ensure you have the following software installed on your machine:

- [Node.js](https://nodejs.org/en) (v18.20.0 or higher)

## Managing Node version

It is highly recommended to install nvm (node package manager) and use to manage node version
- [nvm](https://github.com/nvm-sh/nvm) (0.39.0 or higher)

## How to run it locally

### Installation

1. Clone the repository to your local machine:

```sh
git clone https://github.com/HIRO-MicroDataCenters-BV/cog-framework-ui
```

2. Navigate to the project directory and switch node version using nvm. 
   node version is defined in .nvmrc file

```sh
cd cog-framework-ui
nvm use
```

3. Run `npm install` inside the cloned dir to install the packages described in package.json:

```sh
npm install
```
This will ensure all dependencies are correctly installed and verified.

### Running the Project

4. Start the dev server by running the command below. 

```sh
npm ng serve
```

5. Navigate to `http://localhost:4200/`. The app will automatically
   reload if you change any of the source files.
   - Shut it down manually with `Ctrl-C`.

   
   
## Building and Running with Docker

This project includes a Docker configuration to simplify the process of setting up and running the application.
Follow the steps below to build and run the Docker image.

### Prerequisites

Ensure you have [Docker](https://www.docker.com/) installed on your machine.

1. Building the Docker Image

```sh
docker build . -t cog
```

2. Running the Docker Container
   Once the image is built, you can run a container from it:
```sh
docker run -p 80:80 cog:latest
```

- `-p 80:80` maps port 80 on your host to port 80 in the container. Adjust the port numbers as necessary based on your application configuration.


## License

For source project license, contact administrator for license.
[The Cog Framework License](LICENSE.md)
