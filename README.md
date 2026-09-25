# La Cesoteca

Sitio editorial construido con Next.js (App Router), TypeScript y Tailwind.

## Requisitos

- Node.js 22.18+ (lo exige `npm test`; Vercel usa 24.x)
- npm 10+

## Scripts

- `npm run dev`: entorno local
- `npm run lint`: ESLint
- `npm run build`: build de producción
- `npm run start`: ejecutar build

## Configuración de entorno

Crear `.env.local` con:

- `ADMIN_SESSION_SECRET=<hex aleatorio de 64 caracteres>` **obligatorio**. Firma las sesiones de admin y no tiene respaldo: si falta o tiene menos de 32 caracteres, el login responde 401 y ninguna sesión es válida. Generarlo con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Cambiarlo cierra todas las sesiones abiertas.
- `ADMIN_PASSWORD_HASH=<hash scrypt>` (si no se usa la tabla `admin_credentials` de Supabase)

Opcional para persistencia en Supabase:

- `SUPABASE_URL=<project-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `SUPABASE_STORAGE_BUCKET=cesoteca-assets`
- `LOCAL_ASSET_FALLBACK=true|false` solo para desarrollo local; por defecto queda deshabilitado en producción

Solo desarrollo local (se ignora en producción):

- `ADMIN_PASSWORD=<texto_plano>`

### Generar `ADMIN_PASSWORD_HASH`

El salt se usa como texto hex, igual que en `lib/admin-auth.ts`. La contraseña se pide por consola para que no quede en el historial de la terminal:

```bash
node -e "const c=require('crypto');const rl=require('readline').createInterface({input:process.stdin,output:process.stdout});rl.question('Password: ',p=>{rl.close();const s=c.randomBytes(16).toString('hex');console.log('scrypt$'+s+'$'+c.scryptSync(p,s,64).toString('hex'))})"
```

## Flujo de contenido

- Login admin: `/admin/login`
- Panel admin: `/admin`
- Alta/edición de textos y archivos desde panel
- Cambio de contraseña en `/admin/password` (botón "Cambiar contraseña" del panel). Guarda el hash en Supabase `admin_credentials`; en desarrollo sin Supabase, en `data/admin-credentials.json`. No cierra las sesiones abiertas en otros dispositivos: para eso hay que rotar `ADMIN_SESSION_SECRET` y redeployar.

## Persistencia

- Contenido: `data/poems.json`
- Credenciales admin persistidas: `data/admin-credentials.json` **solo en desarrollo local**. En producción ese archivo no se lee ni se escribe: la contraseña sale de Supabase o de `ADMIN_PASSWORD_HASH`. `data/` está en `.gitignore`.

Si `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` están configurados:

- Contenido: tabla `public.content_entries`
- Credenciales admin: tabla `public.admin_credentials`
- Schema base: `supabase/schema.sql`
- Uploads: bucket de Storage `cesoteca-assets` (o el valor de `SUPABASE_STORAGE_BUCKET`)
- SQL de bucket: `supabase/storage.sql`
- Script de migración de assets locales previos: `node scripts/migrate-local-uploads-to-supabase.mjs`

## Seguridad implementada

- Cookie de sesión admin `httpOnly` + `sameSite=lax`
- Token de sesión firmado con HMAC-SHA256 usando solo `ADMIN_SESSION_SECRET` (sin respaldo; vence a los 7 días)
- Rate-limit en login por IP (en memoria, por instancia)
- Tests de regresión de seguridad: `npm test`
- Protección CSRF por `Origin` en POST sensibles
- Validación de uploads (tipo/extensión/tamaño)
- Ruta interna `/admin/poems/editor` protegida por la sesión admin
- Si Supabase está configurado pero no responde, el login falla (503) en lugar de usar `ADMIN_PASSWORD_HASH` como respaldo

## Descargas

- Fallback por defecto: `public/downloads/mi-poema.docx`
- Cada entrada puede tener `downloadUrl` propio desde el panel

## Notas de despliegue

Para producción con múltiples instancias o serverless:

- usar `public.content_entries` + `public.admin_credentials` en Supabase
- usar Supabase Storage para uploads admin
- no depender de `public/uploads` en producción; ese fallback queda solo para desarrollo local si se habilita
- evitar depender de `data/*.json` como fuente principal
