FROM node:20 AS installed
ARG VELCRO_VERSION=next
RUN test -n "$VELCRO_VERSION"
RUN npm install -g @eighty4/velcro@$VELCRO_VERSION

FROM gcr.io/distroless/nodejs20
WORKDIR /velcro
COPY --from=installed /usr/local/lib/node_modules/@eighty4/velcro /opt/eighty4/velcro
ENV NODE_ENV production
CMD "/opt/eighty4/velcro/bin/velcro"

# the following is a Dockerfile build that would build from source vs installing a released version

#FROM node:20 AS pnpm
#RUN npm install -g pnpm
#
#FROM pnpm AS deps
#WORKDIR /velcro
#COPY package.json pnpm-lock.yaml ./
#RUN pnpm i
#
#FROM pnpm AS builder
#WORKDIR /velcro
#COPY . .
#COPY --from=deps /velcro/node_modules ./node_modules
#RUN pnpm build
#
#FROM gcr.io/distroless/nodejs20
#WORKDIR /velcro
#COPY --from=builder /velcro /velcro
#ENV NODE_ENV production
#ENTRYPOINT ["/nodejs/bin/node", "bin/velcro"]
