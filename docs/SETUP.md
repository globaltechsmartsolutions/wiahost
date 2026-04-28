# Setup local

## Web

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev:web
```

Puerto alternativo:

```bash
pnpm --filter web exec next dev --port 3002
```

## Supabase

Instalar Supabase CLI y comprobar:

```bash
supabase --version
```

Arrancar backend local:

```bash
supabase start
pnpm db:reset
pnpm db:types
```

## Calidad

```bash
pnpm typecheck
pnpm lint
pnpm build:web
```

## Estado conocido

En esta fase la web funciona con datos demo. Supabase esta preparado pero no conectado todavia a las pantallas.
