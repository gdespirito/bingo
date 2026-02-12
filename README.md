# bingo

This template should help get you started developing with Vue 3 in Vite.

## Docker / CI

El workflow **Build and push Docker image** (`.github/workflows/docker-push.yml`) construye la imagen para `linux/amd64` y la sube a `registry.freshwork.dev/bingo:latest` en cada push a `main` (o al lanzarlo manualmente).

### Secrets necesarios en GitHub

En el repo: **Settings → Secrets and variables → Actions** crea estos secrets:

| Secret               | Descripción                          | Ejemplo (no usar tal cual) |
|----------------------|--------------------------------------|----------------------------|
| `REGISTRY_USERNAME`  | Usuario para `registry.freshwork.dev` | usuario o token ID          |
| `REGISTRY_PASSWORD`  | Contraseña o token del registry       | token o contraseña         |

Sin estos secrets, el paso de login al registry fallará.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```
# bingo
