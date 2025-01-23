# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the entire frontend folder contents into the container
COPY . .

# Expose the port that the frontend will run on
EXPOSE 3000

# Start the frontend server
CMD ["npm", "start"]