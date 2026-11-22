# A Superset image with the silverpoint plugins (SUP-T-08, SUP-REQ-011). Superset's frontend is rebuilt
# with the preset registered in its main preset — the classic plugin path (SUP-DD-01) — and served by
# the backend of the same ref, so the frontend and the API agree.
#   docker build -f docker/Dockerfile -t superset-silverpoint .
#   docker build -f docker/Dockerfile --build-arg PLUGIN=/ctx/superset-plugin-chart-silverpoint-0.1.0.tgz -t superset-silverpoint .
#     (a local package: `npm pack --pack-destination docker` first)
# Superset master needs Node 24 (superset-frontend/.nvmrc) and is the only line with React 18.
ARG SUPERSET_REF=master
FROM node:24-bookworm AS frontend
ARG SUPERSET_REF
ARG PLUGIN=superset-plugin-chart-silverpoint@^0.1.0
# Superset's .npmrc holds packages back for min-release-age=3 days; a silverpoint release younger than
# that does not install. Empty keeps Superset's policy; 0 waives it for this install only.
ARG NPM_MIN_RELEASE_AGE=
# As Superset's own Dockerfile: its webpack configuration needs the zstd binary, node-gyp the rest.
RUN apt-get update && apt-get install -y --no-install-recommends build-essential python3 zstd && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch ${SUPERSET_REF} https://github.com/apache/superset.git /superset
WORKDIR /superset/superset-frontend
RUN npm ci
COPY docker/ /ctx/
RUN npm install --no-audit --no-fund ${NPM_MIN_RELEASE_AGE:+--min-release-age=${NPM_MIN_RELEASE_AGE}} "${PLUGIN}" && node /ctx/register.mjs . && npm run build

FROM apache/superset:${SUPERSET_REF}
COPY --from=frontend /superset/superset/static/assets /app/superset/static/assets
