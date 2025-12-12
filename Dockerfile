# --- Stage 1: Build the Application ---
FROM node:20-alpine as build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source files and build the app
COPY . .
# The build command might be different (e.g., 'npm run dev' or 'npm run start') 
# but 'npm run build' is standard for production. Check the package.json if it fails.
RUN npm run build

# --- Stage 2: Serve the Built Application with a lightweight server ---
FROM nginx:alpine as production

# Copy the built output from the 'build' stage into NGINX's web root
COPY --from=build /app/dist /usr/share/nginx/html

# --- ADD THIS LINE TO OVERWRITE DEFAULT NGINX CONFIG ---
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the default HTTP port (NPM will handle this for you later)
EXPOSE 80

# Start NGINX
CMD ["nginx", "-g", "daemon off;"]
