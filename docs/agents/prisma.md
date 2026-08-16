# Prisma

Schema change → `apps/api/prisma/schema.prisma`, then `vp run prisma:migrate` from `apps/api` (`prisma migrate dev`). Prisma writes `prisma/migrations/<timestamp>_<name>/`. Specs that concat SQL append that folder. `vp run prisma:generate` after the client types change.

`--create-only` when Prisma cannot apply (required column on a non-empty table). Edit only the generated file, then `vp run prisma:migrate`.

`dev.db` is the runtime. A migration that exists only as a file is not applied.
