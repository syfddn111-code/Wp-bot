FROM node:18-slim

# Lazımi sistem paketlərini quraşdıraq
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# yt-dlp quraşdıraq
RUN pip3 install --no-cache-dir yt-dlp --break-system-packages

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["npm", "start"]

