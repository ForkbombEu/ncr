ARG NODE_VERSION=20

FROM node:${NODE_VERSION}-bullseye as ncr
RUN apt update && apt install curl git make

## Tried alpine...
# RUN apk update && apk add curl git make
# RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - && source /root/.shrc && \
 # git clone https://github.com/ForkbombEu/ncr.git /ncr-app && cd /ncr-app && make build && chmod +x ncr
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . /ncr-app/
WORKDIR /ncr-app
RUN make build && chmod +x ncr


FROM debian:bullseye
WORKDIR /app
ARG PORT=3000
ENV PORT $PORT
COPY --from=ncr /ncr-app/ncr .
COPY --from=ncr /ncr-app/templates/proctoroom.html templates/proctoroom.html
EXPOSE $PORT
ENTRYPOINT ["./ncr", "-z", "."]
