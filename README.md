# Taiga IT211 — Frontend

# Integrants
Joan Garvin

Hadeer Abbas Khalil

Yimin Jin

Lucas Oliveira

Izan Guerrero

# Desplegament

Frontend en **React + TypeScript + Vite** para el Issue Tracker del proyecto ASW IT211.

El backend (Django) vive en el repositorio [Taiga_it211](https://github.com/asw2526q2-it211/Taiga_it211) y está desplegado en [Render](https://taiga-it211.onrender.com). Este proyecto consume su API REST en `/api`.

El frontend está desplegado en [GitHub Pages](https://asw2526q2-it211.github.io/Taiga_it211_frontend/).

# Taiga
https://tree.taiga.io/project/lucasoliveira-fib-asw2526q2-it211/timeline


## Requisitos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ (`corepack enable` o [instalador oficial](https://pnpm.io/installation))

## Primer uso (cada compañero)

```bash
git clone https://github.com/asw2526q2-it211/Taiga_it211_frontend.git
cd Taiga_it211_frontend
pnpm install
cp .env.example .env   # Windows: copy .env.example .env
pnpm dev
```

Edita `.env` y añade tu `VITE_API_KEY` (la obtienes en el perfil de usuario del backend).

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | URL base de la API (por defecto: producción en Render) |
| `VITE_API_KEY` | Cabecera `X-Api-Key` requerida por la API |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo (http://localhost:5173) |
| `pnpm build` | Compila para producción |
| `pnpm preview` | Previsualiza el build |
| `pnpm lint` | Ejecuta ESLint |

## Estructura

```
src/
  services/     # Cliente HTTP hacia el backend
  components/   # Componentes reutilizables
  config/       # Variables de entorno
  pages/        # Vistas por ruta
```

## API

- Producción: `https://taiga-it211.onrender.com/api`
- Local: `http://localhost:8000/api`

Especificación OpenAPI en el repo del backend: `api/api.yml`.
