FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency declarations
COPY package.json package-lock.json* yarn.lock* ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3333

# Expose API port
EXPOSE 3333

# Run migrations, optional seed, and start application
CMD ["sh", "-c", "npm run typeorm:migrate && if [ \"$RUN_SEED\" = \"true\" ]; then npm run seed; fi && npm start"]
