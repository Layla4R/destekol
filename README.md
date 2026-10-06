# Destekol

Standalone Next.js 14 application. Source, dependencies, build output, deployment and environment configuration belong to this application.

## Run

Copy .env.example to .env.local, configure credentials, then run:

```sh
npm ci
npm run dev
```

Development port: 3002. Production: npm run build, then npm start.

## Data

The server uses the fixed destekol Supabase schema. Host headers and SITE_ID cannot switch schemas or site identity. The existing CMS content stays in that schema; configure this application with its intended database credentials. For physical database independence, export that schema and its storage files into a dedicated Supabase project and set this application's environment accordingly.

Use a separate signing secret and payment/webhook credentials. Secrets are not included in this project. The original database has not been migrated or modified by this source separation.
