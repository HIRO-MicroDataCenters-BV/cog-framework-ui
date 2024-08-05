npm install
nvm use 18.20
ng serve

## Run linter and formater
```sh
ng lint --fix
```

## Local Docker deployment

docker build --platform=linux/amd64 . -t cog

docker tag cog:latest hiroregistry/cogui:latest
docker push hiroregistry/cogui:latest

docker run -p 80:80 cog:latest
