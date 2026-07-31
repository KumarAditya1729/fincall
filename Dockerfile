# Use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# Copy package files and lockfile
COPY package.json bun.lock tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY src ./src

# Run the worker process
CMD ["bun", "run", "src/workers/index.ts"]
