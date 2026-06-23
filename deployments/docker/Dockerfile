# Use the official Nginx image from the Docker Hub
FROM nginx:alpine

# Copy the contents of the /public folder to the Nginx html directory
COPY public /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
