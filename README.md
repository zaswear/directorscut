# Director's Cut

Diario cinematográfico personal. Registra, puntúa y escribe críticas de las películas que ves. Importa tu historial de IMDb, enriquece los datos con OMDb, sube fotos y pósteres a Cloudinary y visualiza estadísticas de tu actividad cinéfila.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + backend | Next.js 14 · App Router · TypeScript |
| Base de datos | SQLite · Prisma ORM |
| Autenticación | NextAuth.js 4 · JWT · credenciales en `.env` |
| Imágenes | Cloudinary (upload preset público, borrado con API key) |
| Datos de películas | OMDb API |
| Gráficos | Recharts |
| Estilos | Tailwind CSS · OKLCH |
| Tipografía | Cormorant Garamond · DM Sans · Space Mono |

---

## Instalación

### Requisitos

- Node.js 18+
- npm

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/zaswear/directorscut.git
cd directorscut

# 2. Instala dependencias
npm install

# 3. Copia y configura las variables de entorno
cp .env.example .env
# Edita .env con tus valores (ver sección siguiente)

# 4. Crea la base de datos y aplica el esquema
npm run db:migrate

# 5. Arranca el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). El middleware redirige a `/login` si no hay sesión activa.

---

## Variables de entorno

Todas van en `.env` (nunca en el repositorio):

```env
# Autenticación
NEXTAUTH_SECRET=genera-una-cadena-aleatoria-larga
NEXTAUTH_URL=http://localhost:3000

# Credenciales de acceso (usuario único)
ADMIN_USER=tu-usuario
ADMIN_PASSWORD=tu-contraseña

# OMDb API — https://www.omdbapi.com/apikey.aspx (gratuita)
OMDB_API_KEY=tu-key

# Base de datos SQLite
DATABASE_URL=file:./dev.db

# Cloudinary — https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_UPLOAD_PRESET=directors_cut   # preset sin firma
CLOUDINARY_TAG=pelicula
CLOUDINARY_API_KEY=                      # necesaria para borrar imágenes
CLOUDINARY_API_SECRET=                   # necesaria para borrar imágenes

# Variables client-side (prefijo NEXT_PUBLIC_ requerido)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=directors_cut
NEXT_PUBLIC_CLOUDINARY_TAG=pelicula
```

### Configurar Cloudinary

1. Crea una cuenta en [cloudinary.com](https://cloudinary.com)
2. En **Settings → Upload → Upload presets**, crea un preset llamado `directors_cut` con modo **Unsigned**
3. Copia el **Cloud name**, **API Key** y **API Secret** desde el Dashboard
4. Para borrado de imágenes, rellena `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET`

### Configurar OMDb

1. Solicita una API key gratuita en [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)
2. El plan gratuito permite 1.000 requests/día (suficiente para uso personal)
3. Las peticiones se cachean 24 horas (`next: { revalidate: 86400 }`)

---

## Comandos

```bash
npm run dev          # servidor de desarrollo en http://localhost:3000
npm run build        # build de producción
npm run start        # servidor de producción (requiere build previo)
npm run lint         # ESLint

npm run db:generate  # regenera el cliente Prisma tras cambios en schema
npm run db:migrate   # aplica migraciones (crea dev.db si no existe)
npm run db:push      # sync esquema sin migraciones (desarrollo rápido)
npm run db:studio    # abre Prisma Studio en el navegador
```

---

## Importar historial de IMDb

1. En IMDb → tu perfil → **Export your ratings** (descarga un CSV)
2. Coloca el archivo en `/export_imdb/`
3. Accede a `/admin/import` en la app
4. La app parsea el CSV, marca las películas ya existentes y permite seleccionar cuáles importar
5. Al confirmar, cada película se enriquece con datos de OMDb antes de guardarse

---

## Estructura del proyecto

```
directorscut/
├── app/
│   ├── (app)/                  ← rutas autenticadas con sidebar
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── peliculas/
│   │   │   ├── page.tsx        ← listado con filtros y búsqueda
│   │   │   ├── nueva/          ← formulario de creación
│   │   │   └── [id]/           ← detalle y edición
│   │   ├── admin/import/       ← importador CSV IMDb
│   │   └── stats/              ← estadísticas con Recharts
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── movies/             ← CRUD películas
│   │   ├── images/             ← gestión imágenes Cloudinary
│   │   ├── omdb/               ← proxy OMDb (search + by ID)
│   │   └── import/             ← importación en lote
│   ├── login/
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx
├── components/
│   ├── layout/                 ← Sidebar
│   ├── movies/                 ← MovieForm, MoviesList, OmdbSearch…
│   ├── stats/                  ← StatsCharts (Recharts)
│   └── ui/                     ← RichEditor, ImageUploader, Gallery…
├── lib/
│   ├── auth.ts                 ← NextAuth config
│   ├── cloudinary.ts           ← upload + optimizedUrl
│   ├── csv.ts                  ← parser exportaciones IMDb
│   ├── db.ts                   ← cliente Prisma singleton
│   ├── omdb.ts                 ← wrapper OMDb API
│   ├── schemas.ts              ← schemas Zod compartidos
│   ├── session.ts              ← getSession / requireSession
│   ├── types.ts                ← tipos de dominio + parseMovie
│   └── utils.ts                ← cn()
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── design_concept/CONCEPT.md   ← paleta, tipografía, principios visuales
├── export_imdb/                ← CSVs de IMDb (gitignored)
└── middleware.ts               ← protege todo excepto /login y /api/auth
```

---

## Esquema de base de datos

```
Movie       id, imdbId (único), title, originalTitle, year, durationMin,
            genres*, directors*, cast*, plot, posterUrl,
            imdbRating, imdbVotes, country, language, rated,
            myRating, watchedAt, watchFormat, review (HTML),
            hasImdbReview, notes, status, importedFromImdb

Image       id, movieId (FK), publicId, url, width, height, type (gallery|poster_alt)

Reference   id, movieId (FK), title, url
```

`*` Almacenados como JSON string (limitación SQLite + Prisma).

---

## Despliegue

### VPS con SQLite (recomendado para uso personal)

```bash
git clone https://github.com/zaswear/directorscut.git
cd directorscut
npm install
cp .env.example .env   # edita con valores de producción

npm run db:generate
npm run db:migrate
npm run build

# Con PM2:
pm2 start npm --name directorscut -- start
```

Valores de `.env` para producción:

```env
NEXTAUTH_URL=https://tu-dominio.com
NEXTAUTH_SECRET=openssl rand -base64 32  # genera uno nuevo
```

### Vercel con Turso (SQLite distribuido)

Turso es la forma más sencilla de usar SQLite en Vercel sin perder datos en cada deploy:

1. Crea una base de datos en [turso.tech](https://turso.tech) (plan gratuito disponible)
2. Instala el driver: `npm install @libsql/client`
3. En `prisma/schema.prisma`, cambia el datasource:

```prisma
datasource db {
  provider     = "sqlite"
  url          = env("TURSO_DATABASE_URL")
  relationMode = "prisma"
}
```

4. Añade en `.env` (y en las variables de Vercel):

```env
TURSO_DATABASE_URL=libsql://tu-db.turso.io
TURSO_AUTH_TOKEN=tu-token
```

5. Conecta el repo en [vercel.com](https://vercel.com) y añade todas las variables de entorno. Vercel detecta Next.js automáticamente.

---

## Generar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Licencia

Uso personal. Sin licencia de distribución pública.
