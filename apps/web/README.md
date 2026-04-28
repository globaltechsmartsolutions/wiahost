# WIAHost web

Aplicacion web de WIAHost construida con Next.js App Router.

La documentacion principal esta en el README de la raiz del repositorio:

```text
../../README.md
```

Docs utiles:

- `../../docs/PRODUCT.md`
- `../../docs/ARCHITECTURE.md`
- `../../docs/DATABASE.md`
- `../../docs/MOBILE_AND_PLAYSTORE.md`
- `../../docs/ROADMAP.md`
- `../../docs/UI_RESEARCH.md`

## Desarrollo

Desde la raiz del monorepo:

```bash
pnpm dev:web
```

O en puerto 3002:

```bash
pnpm --filter web exec next dev --port 3002
```

## Estado

La UI actual usa datos demo desde `src/lib/demo-data.ts`.

La conexion real a Supabase se implementara en la siguiente fase.
