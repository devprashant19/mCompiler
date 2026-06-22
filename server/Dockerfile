FROM node:20-bullseye

# Install g++ and build tools
RUN apt-get update && \
    apt-get install -y g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Render assigns the port dynamically via $PORT
ENV PORT=10000
EXPOSE 10000

CMD ["node", "index.js"]
