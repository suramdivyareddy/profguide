#!/bin/bash
EC2_IP="98.83.237.233"
SSH_KEY_PATH="benny-mac.pem"

# Build and deploy
echo "Deploying to $EC2_IP..."

# Create a deployment archive
tar -czf deploy.tar.gz \
    package.json \
    package-lock.json \
    server.js \
    ./middleware \
    ./middleware/auth.js \
    admin-routes.js \
    ecosystem.config.js
    # database.sqlite

# Copy files to server
scp -i $SSH_KEY_PATH deploy.tar.gz ec2-user@$EC2_IP:~/app/
rm deploy.tar.gz

# SSH into the server and set up the application
ssh -i $SSH_KEY_PATH ec2-user@$EC2_IP '
    # Create app directory if it doesnt exist
    mkdir -p ~/app
    cd ~/app
    tar -xzf deploy.tar.gz
    rm deploy.tar.gz
    npm install
    pm2 stop all
    pm2 start ecosystem.config.js
'
