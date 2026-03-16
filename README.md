# CH0WN3RS 🛡️

> Elite Cybersecurity Club Landing Page

[![Astro](https://img.shields.io/badge/Astro-5.14.1-FF5D01?style=flat&logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## 📋 Descripción

Sitio web oficial del club de ciberseguridad **CH0WN3RS**. Una landing page moderna y dinámica que muestra nuestras estadísticas en tiempo real de CTFtime, con un diseño inspirado en la estética hacker y efectos visuales tipo Matrix.

### ✨ Características

- 🎯 **Integración con CTFtime API** - Estadísticas en tiempo real del equipo
- 🇨🇴 **Ranking Nacional** - Posición entre equipos colombianos
- 🌍 **Ranking Global** - Clasificación mundial del equipo
- 🎨 **Efectos Matrix** - Animación de fondo tipo Matrix con canvas
- 📱 **Diseño Responsive** - Optimizado para todos los dispositivos
- ⚡ **SSR con Astro** - Renderizado del lado del servidor para mejor rendimiento
- 🎭 **Iconos Phosphor** - Iconografía moderna y limpia

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18.0 o superior
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Ch0wn3rs/ch0wn3rs.git

# Navegar al directorio
cd ch0wn3rs

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El sitio estará disponible en `http://localhost:4321`

## 📦 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción
npm start        # Alias para npm run dev
```

## 🏗️ Estructura del Proyecto

```
ch0wn3rs/
├── public/
│   └── Logo-qr.jpeg        # Logo del club
├── src/
│   ├── layouts/
│   │   └── Layout.astro    # Layout principal
│   ├── pages/
│   │   ├── index.astro     # Página principal
│   │   └── api/
│   │       └── ctftime.ts  # Endpoint API para CTFtime
├── astro.config.mjs        # Configuración de Astro
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Tecnologías

- **[Astro](https://astro.build)** - Framework web moderno
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Phosphor Icons](https://phosphoricons.com/)** - Sistema de iconos
- **[Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)** - SSR sobre Cloudflare Workers

## 🌐 API

### Endpoint CTFtime

```typescript
GET /api/ctftime?teamId=408704
```

Retorna las estadísticas del equipo desde CTFtime:
- Ranking global
- Ranking nacional (Colombia)
- Rating actual
- Años activos

### Cache y pins con Cloudflare KV

Para evitar consultar CTFtime en cada request, el proyecto guarda un snapshot en Cloudflare KV y lo refresca bajo demanda cuando la cache supera los 10 minutos. El mismo namespace también almacena los pins manuales de competencias.

Endpoints:

```typescript
GET /api/ctftime
```

Bindings/configuración requerida en `wrangler.toml`:

```bash
CTFTIME_KV
SESSION
```

Pins manuales:

- Key: `ctftime:pins:team:408704`
- Value: JSON con `items`, usando `reference` para reusar eventos de CTFtime o `custom` para fijar competencias manuales.

Observabilidad:

- `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` habilita el beacon oficial de Cloudflare Web Analytics en el layout.
- Si prefieres la inyección automática de Cloudflare desde el dashboard, deja ese token vacío.

## 🎨 Características del Diseño

- **Efecto Matrix**: Animación de fondo con canvas HTML5
- **Tema Oscuro**: Paleta de colores inspirada en terminales hacker
- **Gradientes Neón**: Efectos visuales modernos con colores vibrantes
- **Animaciones Suaves**: Transiciones fluidas y hover effects
- **Tipografía Monospace**: Fuentes estilo código para identidad técnica

## 🚢 Despliegue

El sitio está configurado para desplegarse en **Cloudflare Workers**:

```bash
# Build de producción
npm run build

# Namespace bindings en wrangler.toml
```

### GitHub Actions

El workflow [test-and-deploy.yml](/home/zerotwo/ch0wn3rs/.github/workflows/test-and-deploy.yml) corre tests, build, una smoke test local con `astro preview`, y despliega automáticamente en pushes a `main`.

Secrets requeridos en GitHub:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN` opcional

URL del sitio: [https://ch0wn3rs.ninja](https://ch0wn3rs.ninja)

## 👥 Equipo

**CH0WN3RS** - Elite Cybersecurity Club

- [CTFtime Profile](https://ctftime.org/team/408704)
- Team ID: 408704

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Contacto

Para más información sobre el club o colaboraciones, visita nuestro perfil en CTFtime.

---

⚡ Hecho con 💻 por CH0WN3RS
