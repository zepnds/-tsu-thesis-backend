#!/bin/bash

# Navigate to the directory containing this script
cd "$(dirname "$0")"

echo "Stopping existing containers and removing orphans..."
docker-compose down --remove-orphans

echo "Building and starting containers in detached mode..."
docker-compose up -d --build

echo "Deployment complete! Checking container status:"
docker-compose ps
