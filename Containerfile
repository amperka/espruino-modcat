# The catalog ships minified modules, and modules/@amperka/*.min.js is generated
# (.gitignore), so the image builds them the way CI does before a deploy.
#
# Both base images are pinned to exact tags, so Dependabot moves them.
FROM node:26.13.1-alpine3.24 AS build

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# `npm run build` is `npm run minify`: it rewrites every modules/**/*.js next
# to itself as a .min.js, so the sources are all the stage needs.
COPY modules/ ./modules/
RUN npm run build

FROM docker.angie.software/angie:1.12.6-minimal

LABEL org.opencontainers.image.title="js.amperka.ru" \
      org.opencontainers.image.description="Espruino module catalog: modules, board json and firmware binaries" \
      org.opencontainers.image.source="https://github.com/amperka/espruino-modcat"

# The config replaces the stock default server instead of sitting next to it.
COPY deploy/angie.conf /etc/angie/http.d/default.conf

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
