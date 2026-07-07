FROM node:20-alpine

WORKDIR /app

# Install dependencies first for build caching
COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run development server by default
CMD ["npm", "run", "dev"]
