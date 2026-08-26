FROM node:22-bookworm-slim
RUN npm install -g pnpm@11.3.0
WORKDIR /app
EXPOSE 3000
CMD ["sh", "-c", "pnpm install && pnpm dev --host 0.0.0.0"]
