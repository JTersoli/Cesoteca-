# La Cesoteca

Sitio editorial construido con Next.js (App Router), TypeScript y Tailwind.

## Requisitos

- Node.js 20+
- npm 10+

## Scripts

- `npm run dev`: entorno local
- `npm run lint`: ESLint
- `npm run build`: build de producción
- `npm run start`: ejecutar build

## Configuración de entorno

Crear `.env.local` con:

- `ADMIN_SESSION_SECRET=<hex-largo-seguro>`
- `ADMIN_PASSWORD_HASH=<hash scrypt>`

Compatibilidad temporal (no recomendado):

- `ADMIN_PASSWORD=<texto_plano>`

### Generar `ADMIN_PASSWORD_HASH`

```bash
node -e "const c=require('crypto');const p=process.argv[1];const s=c.randomBytes(16).toString('hex');const d=c.scryptSync(p,Buffer.from(s,'hex'),64).toString('hex');console.log('scrypt$'+s+'$'+d)" "TU_PASSWORD"
```

## Flujo de contenido

- Login admin: `/admin/login`
- Panel admin: `/admin`
- Alta/edición de textos y archivos desde panel
- Cambio de contraseña desde panel (guarda hash en `data/admin-credentials.json`)

## Persistencia

- Contenido: `data/poems.json`
- Credenciales admin persistidas: `data/admin-credentials.json`
- Archivos subidos: `public/uploads/`

## Seguridad implementada

- Cookie de sesión admin `httpOnly` + `sameSite=lax`
- Verificación de token firmado
- Rate-limit en login
- Protección CSRF por `Origin` en POST sensibles
- Validación de uploads (tipo/extensión/tamaño)
- Ruta interna `/poems/editor` oculta en producción si no hay sesión admin

## Descargas

- Fallback por defecto: `public/downloads/mi-poema.docx`
- Cada entrada puede tener `downloadUrl` propio desde el panel

## Notas de despliegue

Este proyecto hoy usa filesystem local para datos (`data/*.json`, `public/uploads`).
Para producción con múltiples instancias o serverless, migrar a DB/almacenamiento persistente.
