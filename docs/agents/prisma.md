# Prisma

Prisma writes every `migration.sql`. The agent’s job is the schema and the migrate command.

1. Change tables in `apps/api/prisma/schema.prisma` only.
2. From `apps/api`, run `./node_modules/.bin/prisma migrate dev --name <name>`. Prisma creates `prisma/migrations/<timestamp>_<name>/migration.sql` and applies it to `dev.db`.
3. Specs that concat SQL append that generated folder. `vp run prisma:generate` after the client types change.

`vp run prisma:migrate -- --name …` swallows `--name`. Use the local Prisma binary.

`--create-only` when Prisma cannot apply (required column on a non-empty table). Prisma still creates the file. Edit only that generated file, then `prisma migrate dev`.

`dev.db` is the runtime. A migration that exists only as a file is not applied.
