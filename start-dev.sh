#!/bin/bash

# Kill any existing processes on port 4201
echo "Checking for existing processes on port 4201..."
lsof -i :4201 | grep LISTEN | awk '{print $2}' | xargs -r kill

# Start the proxy server in the background
echo "Starting proxy server..."
node proxy-server-4201.js &
proxy_pid=$!

# Wait to ensure the proxy server is running
echo "Waiting for proxy server to start..."
sleep 3

# Check if proxy server is running
if lsof -i :4201 | grep LISTEN > /dev/null; then
  echo "Proxy server is running on port 4201"
else
  echo "Error: Proxy server failed to start on port 4201"
  kill $proxy_pid 2>/dev/null
  exit 1
fi

# Start Vite dev server
echo "Starting Vite dev server..."
npm run dev

# When Vite is stopped, also stop the proxy server
echo "Stopping proxy server..."
kill $proxy_pid 