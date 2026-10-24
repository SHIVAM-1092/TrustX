FROM node:lts-slim

WORKDIR /app

# Copy package files and install dependencies (production only)
COPY package.json ./
# No lockfile present, install all deps (including dev for Vite)
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Vite dev server (host 0.0.0.0 is set in vite.config.ts)
CMD ["npm", "run", "dev"]
