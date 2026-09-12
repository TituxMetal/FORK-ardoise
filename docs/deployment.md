# Deployment

Ardoise runs as one Portainer stack on a VPS, behind Nginx Proxy Manager (NPM).
A single HTTPS hostname terminates TLS at NPM and reaches only the web container;
the web container proxies `/api` to the API container over the stack's networks.
The SQLite database lives on a named volume, so restarts and stack redeploys keep
the Groups, Invites, Expenses, Services and Paybacks already recorded.

This runbook is for the first deploy, the update and the rollback. It assumes no
knowledge of the source.

## Prerequisites

These must already exist on the server. The stack attaches to them and never
creates them.

- Docker with Portainer, running the other stacks.
- The external Docker networks `reverse-proxy-nw` and `default-nw`.
- NPM attached to `reverse-proxy-nw`, with a public hostname and a TLS
  certificate for it.
- Portainer's `ghcr.io` registry credential: the images are private on the GitHub
  container registry, and Portainer needs that credential to pull them.

The images themselves are published by CI: every push to `main` builds
`ghcr.io/tituxmetal/fork-ardoise-api` and `ghcr.io/tituxmetal/fork-ardoise-web`
under a `sha-<hash>` tag, and the commit that is newest on `main` also tags them
`prod` and `latest`.

## First deploy

1. In Portainer, create a stack and paste the contents of `docker/compose.yaml`.
2. Add the stack environment variables below, with your own values.

| Variable             | Service | Value                          | Meaning                                                                                                                                                            |
| -------------------- | ------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`       | api     | `file:/data/ardoise.db`        | The SQLite database on the stack volume; the Prisma CLI and the runtime resolve the same file.                                                                     |
| `BETTER_AUTH_URL`    | api     | `https://ardoise.example.com`  | The public origin of the site: the scheme and hostname a browser uses.                                                                                             |
| `BETTER_AUTH_SECRET` | api     | output of the command below    | Signs sessions. At least 32 characters, and never the placeholder committed in `apps/api/.env.example`.                                                            |
| `RUN_MIGRATIONS`     | api     | `true` (the default)           | Applies pending database migrations on boot, before the API serves; set `false` to skip them.                                                                      |
| `SEED_DEMO_DATA`     | api     | `true`, or unset               | Seeds the fixed demo dataset on boot, after the migrations and before the API serves. Off unless set to exactly `true`; remove it once the deployment is verified. |
| `API_URL`            | web     | `http://fork-ardoise-api:3000` | Where the web container forwards `/api` calls; the API's name on the stack's networks and its fixed port.                                                          |

Generate the secret on the server or your machine, and paste the output:

```bash
openssl rand -base64 32
```

The API container refuses to start if `BETTER_AUTH_SECRET` is missing or shorter
than 32 characters. That check is a floor, not a guarantee: the example value in
`apps/api/.env.example` is long enough to pass it, so never paste it.

3. Deploy the stack. The API applies the migrations to the empty volume, and the
   web container starts once the API answers its health check.

## The NPM host

Create a Proxy Host pointing the hostname at the stack:

- Domain Names: your hostname.
- Scheme: `http`, Forward Hostname: `fork-ardoise-web`, Forward Port: `3000`.
- Enable the certificate for the hostname and force SSL.

Port `3000` is the fixed port the web container listens on. Only the web
container needs a proxy host; the API publishes no host port and NPM never
targets it directly.

**HTTPS is mandatory.** better-auth names the session cookie
`__Secure-better-auth.session_token` and marks it `Secure`, and a browser refuses
to store a `Secure` cookie delivered over plain HTTP. On a plain-HTTP origin
sign-in appears to succeed while no session persists, and nothing appears in the
server logs to explain it. Do not deploy Ardoise on a bare IP address or before
the certificate is issued.

## Verify the deployment

Run these against `https://<hostname>` after the stack is up:

- [ ] Register the first User.
- [ ] Create a Group.
- [ ] Copy the Group's Invite link, open it in a private window, register a
      second User and join the Group.
- [ ] Record an Expense in the Group.
- [ ] Record a Service in the Group.
- [ ] Record a Payback between the two Members.
- [ ] Reload the page: the session persists.
- [ ] Open a deep link such as `/groups/<id>` in a fresh tab: the page loads
      instead of a 404.

## Verify with the demo dataset

A first deployment can be exercised end to end without hand-building data. With
the stack variable `SEED_DEMO_DATA` set to the literal `true` (service `api`), the
container seeds a fixed demo dataset on boot — after `prisma migrate deploy` and
before the API serves. Unset, or any value other than `true`, seeds nothing.

The comparison is exact: `True`, `1`, or a value with a trailing space seeds
nothing. Leave `RUN_MIGRATIONS` at its default `true` on a fresh volume — the seed
needs the schema the migrations apply.

The seed runs only while the `user` table is empty. A second boot changes nothing,
and a stack that already holds real Users never gets a known-password account,
whatever the toggle says. Removing the variable stops the seed from running; it
removes nothing that is already on the volume, so tear the dataset down with
[Remove the demo dataset](#remove-the-demo-dataset) once the deployment is
verified.

| Item     | Demo value                                                                                        |
| -------- | ------------------------------------------------------------------------------------------------- |
| Accounts | `lea@ardoise.test` and `bob@ardoise.test`                                                         |
| Password | `ardoise-demo`, both accounts                                                                     |
| Group    | `Démo Ardoise`, both accounts as Members                                                          |
| Invite   | `https://<hostname>/invites/ardoise-demo-invite`                                                  |
| Expenses | `Courses` 30,00 € paid by Léa, `Essence` 20,00 € paid by Bob — each split between the two Members |
| Service  | `Bricolage` 20,00 € provided by Léa, split between the two Members                                |
| Payback  | Bob pays Léa 5,00 €                                                                               |
| Balances | Léa **+10,00 €**, Bob **−10,00 €**                                                                |

Every seeded row is dated 2026-01-01. The API stores whole cents; the app displays
euros, so the table above is what a browser shows.

The flow the dataset exists to verify:

1. Sign in as `lea@ardoise.test`.
2. The Groups list shows `Démo Ardoise`; open it and read the slate: two Expenses,
   one Service, one Payback, and the Balances above — Léa is owed 10,00 €.
3. Copy the Group's Invite link, then sign out.
4. Paste the link — `/invites/ardoise-demo-invite` — into the address bar: the
   Invite page opens while signed out.
5. Register a new account from that page, then press **Rejoindre le Groupe**:
   registration alone does not join, the button is the join, so the account is a
   Member of `Démo Ardoise` only once it is pressed.

The same seed runs by hand against a local database: from `apps/api`, run
`bun run seed:demo`. It targets the database the local API serves — `DATABASE_URL`
from the environment (bun loads `apps/api/.env` when you have one) or the
repo-relative `prisma/dev.db` otherwise — and prints whether it seeded the dataset
or skipped it.

## Remove the demo dataset

This dataset is a verification aid, not a feature. Removing `SEED_DEMO_DATA` from
the stack stops the seed from running again and removes nothing already written:
the two accounts keep the password published above, and the Group keeps its
known Invite secret, so anyone who has read this runbook can sign in and join.
Tear the data down once the deployment is verified.

- **A stack that holds no real data yet** — the usual case, where the dataset was
  the first thing on the volume: stop the stack, delete its volume (Docker
  registers it as `<stack-name>_data`), remove the `SEED_DEMO_DATA` variable, and
  redeploy. The API migrates the fresh volume on boot and serves an empty Ardoise.
- **A stack that already holds real data**: stop the stack and delete the two
  Users and the Group with any SQLite client against the volume:

  ```sql
  PRAGMA foreign_keys = ON;
  DELETE FROM user WHERE email IN ('lea@ardoise.test', 'bob@ardoise.test');
  DELETE FROM "group" WHERE inviteSecret = 'ardoise-demo-invite';
  ```

  The schema cascades: each User takes their Sessions, Accounts and Member seats,
  and the Group takes its Members, Expenses, Services and Paybacks. SQLite
  enforces that per connection and leaves it off by default, so the `PRAGMA` is
  load-bearing — without it the two `DELETE`s drop the rows they name and leave
  everything hanging off them behind. Leave the stack stopped until the volume is
  clean, then redeploy.

The seed writes its rows one use case at a time, so a boot killed partway through
leaves half a dataset. The next boot then refuses to serve it: the API logs
`The demo dataset is half-seeded: …`, exits non-zero, and the restart policy
retries it. Reset the volume as above — the demo Group may not exist yet, so the
`user` delete is the load-bearing one — and boot again.

## Update

1. Push to `main`. CI builds and publishes the new `sha-<hash>` images; `prod`
   and `latest` belong to the commit that is newest on `main`, so a push that a
   later one supersedes during its checks publishes its own `sha-<hash>` alone
   and leaves `prod` to that later run.
2. Wait for that commit's **Build and Push Docker Images** run to finish
   successfully. The publish is asynchronous and the redeploy below re-pulls
   `prod`: starting it while the run is still going pulls the previous images
   and keeps the previous commit serving.
3. In Portainer, open the stack and redeploy it **with the image re-pull**:
   Portainer's _Re-pull image and redeploy_. A plain redeploy reuses the `prod`
   image already on the host and keeps the previous commit serving. The API
   applies any pending migration before serving, and the web container serves
   the new build.

The data stays: it lives on the stack's `data` volume, not in the container.

Keep `RUN_MIGRATIONS` at `true` — its default, so it can be left unset — for any
release that carries a migration. Set it to `false` only once a release is stable
and carries no migration: with the toggle off the container skips
`prisma migrate deploy` entirely, so the API boots against the schema the volume
already holds and the release looks healthy until it fails at request time
instead of at boot.

You can pin a release by editing the `image:` lines to the `sha-<hash>` tag
from the CI run that built it; that is also how you tell two builds apart.

## Roll back

Re-pin the previous `sha-<hash>` tag on both `image:` lines in the stack and
redeploy with the image re-pull. That restores the previous code but not the
previous schema: a migration already applied to the volume stays applied.

## Recover the volume

The database is the stack's `data` volume — Docker registers it as
`<stack-name>_data` — mounted at `/data`. Ardoise ships no backup or restore
tooling and documents no procedure: recovering the volume (for example after a
failed migration, or onto a fresh server) is done with your own backup tooling,
restoring the volume before the stack serves traffic. Restoring the volume brings
back Groups, Invites, Expenses, Services and Paybacks; Balances re-derive from
the restored records.
