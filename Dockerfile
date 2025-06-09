# SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
#
# SPDX-License-Identifier: AGPL-3.0-or-later

ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bullseye AS ncr
RUN apt update && apt install -y curl git make

## Tried alpine...
# RUN apk update && apk add curl git make
# RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && source /root/.shrc && \
 # git clone https://github.com/ForkbombEu/ncr.git /ncr-app && cd /ncr-app && make build && chmod +x ncr
RUN corepack enable && corepack prepare pnpm@8 --activate
COPY . /ncr-app/
WORKDIR /ncr-app
RUN make build && chmod +x ncr


FROM debian:bullseye
WORKDIR /app
ARG PORT=3000
ENV PORT=$PORT
ARG ZENCODE_DIR=/app/contracts
ENV ZENCODE_DIR=$ZENCODE_DIR
ARG PUBLIC_DIR=/app/public
ENV PUBLIC_DIR=$PUBLIC_DIR
COPY --from=ncr /ncr-app/ncr .
EXPOSE $PORT
ENTRYPOINT ["./ncr"]
