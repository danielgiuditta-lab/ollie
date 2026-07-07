# Use the official Node.js 20 image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (production and dev dependencies are required to build)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend and backend bundle
RUN npm run build

# Expose the port the Express server listens on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["npm", "run", "start"]
