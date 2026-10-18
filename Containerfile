ARG NODE_IMAGE=node:lts-alpine
ARG ANGIE_IMAGE=docker.angie.software/angie:1.12.2-minimal

# The catalog ships minified modules, and modules/@amperka/*.min.js is generated
# (.gitignore), so the image builds them the way CI does before a deploy.
FROM ${NODE_IMAGE} AS build

WORKDIR /build

# yarn.lock is a v1 lockfile, and the official node image already carries the
# classic yarn that matches it (yarn 1.22.22 for node 24).
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive --no-progress

# `yarn build` is `yarn minify`: it rewrites every modules/**/*.js next to
# itself as a .min.js, so the sources are all the stage needs.
COPY modules/ ./modules/
RUN yarn build

FROM ${ANGIE_IMAGE}

LABEL org.opencontainers.image.title="js.amperka.ru" \
      org.opencontainers.image.description="Espruino module catalog: modules, board json and firmware binaries" \
      org.opencontainers.image.source="https://github.com/amperka/espruino-modcat"

# The stock server in the image listens on 80 and would serve its own stub
# page, drop it. The config keeps an explicit ownership and mode: COPY otherwise
# carries the uid/gid and the mode of the file in the build context.
RUN rm -f /etc/angie/http.d/default.conf
COPY --chown=root:root --chmod=0644 deploy/angie.conf /etc/angie/http.d/site.conf

# The catalog root mirrors the repository: /modules/, /binaries/ and /json/ are
# the URL space, so the three directories are copied as they are.
COPY --from=build /build/modules /srv/espruino-modcat/site/modules
COPY binaries /srv/espruino-modcat/site/binaries
COPY json /srv/espruino-modcat/site/json

EXPOSE 8080

# A file the image always carries: `/` is a redirect to the documentation, and
# /json/boards.json leaves the container for espruino.com.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD wget -q -O /dev/null --spider http://127.0.0.1:8080/json/ISKRAJS.json || exit 1
