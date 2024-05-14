npm install
nvm use 18.20
ng serve


## Local Docker deployment 

docker build . -t cog
docker run -p 80:80 cog