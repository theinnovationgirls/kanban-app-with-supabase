# Tablero Kanban con equipos (Supabase + Google Auth)

Tablero Kanban estilo Trello pensado para trabajar con grupos de chicas en un
curso: cada equipo tiene su propio tablero, las integrantes se suman con un
código de invitación, y hay un rol de **administradora** que puede crear
equipos y supervisar todos los tableros.

Construido con **Next.js**, **Tailwind CSS** y **Supabase** (base de datos +
autenticación con Google).

---

## Índice

- [Cómo usarlo (guía rápida)](#cómo-usarlo-guía-rápida)
- [Arquitectura del proyecto](#arquitectura-del-proyecto)
- [Modelo de datos](#modelo-de-datos)
- [Puesta en marcha desde cero](#puesta-en-marcha-desde-cero)
- [Desarrollo local](#desarrollo-local)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Problemas comunes](#problemas-comunes)

---

## Cómo usarlo (guía rápida)

### Si sos la administradora

1. Entrá a la app y logueate con tu cuenta de Google.
2. Vas a caer directo en el **Panel de equipos**.
3. Escribí un nombre (ej: `Grupo A - 4to año`) y hacé clic en **"Crear
   equipo"**.
4. Te va a aparecer un **código de 6 caracteres** (ej: `A3F7K2`) debajo del
   nombre del equipo — hacé clic ahí para copiarlo.
5. Pasale ese código a las chicas de ese grupo (por WhatsApp, en el pizarrón,
   como prefieras).
6. Para ver el tablero de un equipo en cualquier momento, hacé clic en **"Ver
   tablero"** al lado de su nombre. Para volver al panel, usá **"Volver al
   panel"** arriba a la izquierda.
7. Repetí el paso 3 por cada grupo del curso (podés tener entre 3 y 6 sin
   ningún problema).

### Si sos una integrante de un equipo

1. Entrá a la app y logueate con tu cuenta de Google.
2. La primera vez, te va a pedir un **código de equipo** — pedíselo a tu
   profe y escribilo (no importa si usás mayúsculas o minúsculas).
3. Una vez adentro, vas a ver el tablero de tu equipo con 3 columnas:
   **Pendiente**, **En proceso** y **Terminado**.
4. Para agregar una tarea: botón **"Nueva tarea"** arriba a la derecha, o el
   **+** en el encabezado de cada columna.
5. Para mover una tarea de columna: hacé clic sostenido sobre la tarjeta y
   arrastrala a otra columna.
6. Para editar o borrar una tarea: hacé clic sobre la tarjeta.
7. Todo lo que hagas lo ven **en el momento** el resto de las integrantes de
   tu mismo equipo (se actualiza solo, sin recargar la página).
8. Para cerrar sesión, usá el ícono de salida arriba a la derecha.

> Cada equipo solo ve **sus propias** tareas. Ningún grupo puede ver ni tocar
> el tablero de otro grupo.

---

## Arquitectura del proyecto

```
Login con Google (Supabase Auth)
        │
        ▼
  ¿Sos admin?
   │        │
  Sí        No
   │        │
   ▼        ▼
 Panel   ¿Estás en algún equipo?
 de           │         │
 equipos     Sí         No
   │          │          │
   ▼          ▼          ▼
Elegís    Vas directo   Pantalla para
un equipo  a tu tablero  ingresar el
   │          │          código
   └────┬─────┘              │
        ▼                    │
   Tablero Kanban ◄──────────┘
   (filtrado por equipo)
```

Esta lógica de "quién ve qué" vive en `components/team-gate.tsx`, que decide
qué pantalla mostrar apenas la persona se loguea.

La protección de datos **no depende solo del código de la app**: está
reforzada a nivel de base de datos con *Row Level Security* (RLS) en
Supabase, así que aunque alguien intentara manipular las consultas desde el
navegador, no podría leer ni escribir tareas de un equipo que no es el suyo.

---

## Modelo de datos

| Tabla           | Para qué sirve                                              |
|-----------------|--------------------------------------------------------------|
| `profiles`      | Un perfil por usuaria logueada. Tiene el flag `is_admin`.    |
| `teams`         | Cada equipo/grupo, con su `invite_code` único.               |
| `team_members`  | Relación: qué usuaria pertenece a qué equipo.                |
| `tasks`         | Las tarjetas del Kanban. Cada una pertenece a un `team_id`.  |

Reglas de seguridad (RLS) resumidas:

- Una **admin** (`is_admin = true`) puede ver y gestionar todo.
- Una **integrante común** solo puede ver/crear/editar/borrar tareas de los
  equipos donde figura en `team_members`.
- Unirse a un equipo se hace a través de la función `join_team(code)`, que
  valida el código y evita que alguien se sume a un equipo sin conocerlo.

El detalle completo de tablas, funciones y políticas está en
[`supabase-teams-setup.sql`](./supabase-teams-setup.sql) (requiere haber
corrido antes [`supabase-auth-setup.sql`](./supabase-auth-setup.sql)).

---

## Puesta en marcha desde cero

Si estás armando una copia nueva de este proyecto (otro curso, otra
instancia), estos son todos los pasos:

### 1. Crear el proyecto en Supabase

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New
   project**.
2. Anotá la **Project URL** y la **anon key** (Settings → API).

### 2. Configurar login con Google

1. En [Google Cloud Console](https://console.cloud.google.com/), creá un
   proyecto y configurá la **pantalla de consentimiento OAuth** (tipo
   Externo).
2. Creá un **ID de cliente OAuth** de tipo "Aplicación web":
   - Orígenes autorizados de JavaScript: la URL de tu app (ej:
     `https://tu-app.vercel.app`).
   - URI de redirección autorizados:
     `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. En Supabase: **Authentication → Sign In / Providers → Google** → activar
   y pegar el **Client ID** y **Client Secret**.
4. En Supabase: **Authentication → URL Configuration** → configurar **Site
   URL** y **Redirect URLs** con la URL real de tu app.

### 3. Correr los scripts SQL

En **Supabase → SQL Editor**, en este orden:

1. `supabase-auth-setup.sql` (crea la tabla `tasks` con RLS básico por
   usuario).
2. `supabase-teams-setup.sql` (agrega equipos, perfiles y rol admin).
3. Al final de `supabase-teams-setup.sql` hay dos líneas comentadas para
   convertir tu usuaria en administradora. Descomentalas, poné tu email, y
   corrélas **después** de haberte logueado al menos una vez en la app.

### 4. Variables de entorno

Configurá en Vercel (o en tu `.env.local` para desarrollo):

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 5. Deploy

Conectá el repo a Vercel (o usá el que ya está conectado). Cada `push`/merge
a `main` dispara un deploy automático.

---

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Necesitás tener el
`.env.local` con las variables de Supabase (paso 4 de arriba), y agregar
`http://localhost:3000` a los orígenes autorizados de Google y a los
Redirect URLs de Supabase si querés probar el login en local.

---

## Estructura de carpetas

```
app/
  auth/
    login/page.tsx      → pantalla de login con Google
    callback/route.ts   → recibe la respuesta de Google/Supabase
    error/page.tsx       → pantalla de error de auth
  page.tsx               → punto de entrada, renderiza <TeamGate />
components/
  team-gate.tsx           → decide qué pantalla mostrar según rol/equipo
  admin-panel.tsx         → crear equipos y elegir cuál ver (solo admin)
  join-team-form.tsx      → ingresar código de equipo (integrantes)
  kanban-board.tsx        → el tablero en sí, filtrado por equipo
  board-column.tsx        → una columna (Pendiente/En proceso/Terminado)
  task-card.tsx            → una tarjeta de tarea
  task-dialog.tsx          → modal para crear/editar tareas
  ui/                      → componentes base (botón, input, card, etc.)
lib/
  types.ts                 → tipos de Task, Team, Profile
  supabase/
    client.ts               → cliente de Supabase (navegador)
    server.ts                → cliente de Supabase (servidor)
    proxy.ts                 → lógica del middleware de sesión
middleware.ts               → protege las rutas, redirige a /auth/login
supabase-auth-setup.sql     → SQL: tabla tasks + RLS por usuario
supabase-teams-setup.sql    → SQL: equipos, perfiles, rol admin
```

---

## Problemas comunes

**"No tengo ningún equipo" después de loguearme, pero soy la admin**
Te falta correr las 2 líneas finales de `supabase-teams-setup.sql` con tu
email para marcarte como `is_admin = true`.

**Una alumna pone el código y le dice "código inválido"**
Revisá mayúsculas/minúsculas (el sistema las normaliza solo, pero confirmá
que no haya espacios de más) y que el equipo exista en el Panel de equipos.

**Cambié código y no se ve reflejado en la app**
Fijate en Vercel → pestaña **Deployments** que el último build haya
terminado en estado **Ready**. Si dice **Error**, el log de esa pantalla
tiene el detalle.

**Quiero agregar puntos, sprints, o alguna otra funcionalidad**
El modelo de datos está pensado para crecer: se puede sumar una columna
`points` a `tasks`, una tabla `sprints`, etc. sin romper lo que ya
funciona.
