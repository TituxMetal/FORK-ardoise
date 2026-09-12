# Ardoise

Expenses, services and paybacks between friends, organised in groups.

## Development

```bash
bun install
vp dev
```

`vp dev` boots the web app (Vite, http://localhost:1337) and the API (Hono, http://localhost:3000). The web app proxies `/api` to the API.

```bash
vp test
vp check
```

## Deployment

Ardoise runs as a Portainer stack behind Nginx Proxy Manager, with images pulled
from the GitHub container registry. The runbook — prerequisites, first deploy,
the NPM host, the acceptance checklist, update and rollback — is in
[docs/deployment.md](docs/deployment.md).
