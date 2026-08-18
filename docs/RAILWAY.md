# Railway production deployment

The production project uses two services from this repository:

- `api`: private Bun/Elysia service on port `3001`.
- `web`: public nginx service on port `8000`; it proxies API and storage
  requests to `api.railway.internal`.

## API service

Set these variables:

```text
RAILWAY_DOCKERFILE_PATH=Dockerfile.api
NODE_ENV=production
API_PORT=3001
DATABASE_URL=file:/app/storage/dev.db
TZ=America/Mexico_City
```

Attach one persistent volume at `/app/storage`. It contains all production
state:

```text
/app/storage/dev.db
/app/storage/photos/
/app/storage/signatures/
/app/storage/assets/
```

Do not configure replicas for this service while it uses SQLite. Keep the API
private; only `web` needs a public domain.

## Web service

Set this variable:

```text
API_HOST=api.railway.internal
```

Use port `8000` for public networking and `/health` for the health check.

## Backups

In the API service's **Backups** tab, enable daily, weekly, and monthly volume
backups. Create a manual backup before each application or schema change.

Export a second off-platform copy of `dev.db` and `storage/` regularly. Railway
volume backups can only be restored inside the same project and environment.

## Deploy and rollback

1. Deploy and test with a Railway-provided domain.
2. Verify login, user count, searches, photos, signatures, validation QR codes,
   and printing.
3. Stop writes to the old server.
4. Upload one final SQLite backup and the final storage delta.
5. Point the existing custom domain at the Railway `web` service.
6. Keep the old server stopped but intact until the new deployment has run
   successfully for at least one week.

To roll back, restore the old DNS/tunnel target and start the old API. Never
allow both copies to accept writes at the same time.
