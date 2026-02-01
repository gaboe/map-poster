# Deployment (Coolify)

## Local Development

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

## Production (Coolify)

### Prerequisites

- Access to Coolify at `clf.gaboe.xyz`
- Environment variables configured in Coolify UI
- `docker-compose.prod.yml` selected as the deployment file

### Services

- `db` (PostGIS): `postgis/postgis:18-3.6`
- `web-app`: TanStack Start server
- `api`: FastAPI map generation service

### Environment Variables

Configure these in Coolify (do not commit secrets):

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `DATABASE_URL`
- `BASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BREVO_API_KEY`
- `CONTACT_FORM_RECIPIENTS`
- `ENVIRONMENT`
- `MAP_POSTER_API_URL`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN`
- `VERSION`
- `VITE_BASE_URL`
- `VITE_BETTER_AUTH_URL`
- `VITE_ENVIRONMENT`
- `VITE_SENTRY_DSN`
- `VITE_VERSION`
- `DOMAIN`

### PostGIS Verification

```bash
psql $DATABASE_URL -c "SELECT PostGIS_Version();"
```

### Health Checks

```bash
curl -s https://<domain>/api/health
```
