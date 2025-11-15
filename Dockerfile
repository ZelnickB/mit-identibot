FROM node:current

ENV NODE_ENV=production

COPY . /data
WORKDIR /data

RUN npm install -g pnpm@latest-10
RUN pnpm install

EXPOSE 80/tcp
VOLUME /data/usr

ENTRYPOINT pnpm start

LABEL org.opencontainers.image.source="https://github.com/ZelnickB/mit-identibot.git" \
      org.opencontainers.image.url="https://github.com/ZelnickB/mit-identibot#readme" \
      org.opencontainers.image.authors="Benjamin N. Zelnick" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later" \
      org.opencontainers.image.title="MIT IdentiBot Container Image"
