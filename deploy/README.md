# deploy: image and serving rules

```
angie.conf    angie config: one server on port 8080
```

The image itself is built from `Containerfile` in the repository root, next to
`.dockerignore`.

## Build and run

```bash
docker build --load -f Containerfile -t espruino-modcat:test .
docker run -d --name espruino-modcat -p 8080:8080 espruino-modcat:test
```

The build stage minifies the modules with yarn, and the result is copied into an
angie image: the build context needs nothing but the repository itself. The
image listens on 8080, not 80, so it runs unprivileged.

## What the container serves

- `/modules/`, `/binaries/`, `/json/` from `/srv/espruino-modcat/site`.
- `/json/boards.json` from espruino.com, with the ISKRAJS board spliced in: the
  IDE needs every board espruino.com knows about, not only ours. When
  espruino.com is unreachable, the bundled ISKRAJS-only catalog answers
  instead.
- A catalog path the image does not carry is not ours, so it answers 302 to
  espruino.com - plain http for device clients, https for requests that arrive
  through the TLS-terminating outer proxy.
- `/` and `/yodo` redirect to the documentation on wiki.amperka.ru.
- Every answer carries the CORS headers the Espruino Web IDE needs.

What the outer layer does, not the container: the config knows nothing about TLS
or hostnames, so something outside terminates TLS and routes the name here.

## Publishing

`.github/workflows/push.yaml` builds this image on every pull request and
publishes it to the Google Artifact Registry on every push to `master`, as
`espruino-modcat`, tagged both `latest` and with the build time in UTC.
