# Portafolio · Diego Eduardo Martínez Cruz

Ingeniería mecatrónica, robótica y startups. Sitio estático en estilo de plano técnico, con una celda robótica 3D, láminas de proyectos que se apilan al hacer scroll, un visor CAD con vista explosionada y una demo de AI Physics que aprende en vivo.

## Estructura

```
index.html              Página completa
assets/css/styles.css   Estilos (tema claro y oscuro)
assets/js/main.js       Tema, menú, láminas apiladas, contadores
assets/js/blueprint.js  Celda robótica del inicio, modelos CAD y visor CAD (Three.js r128)
assets/js/physics.js    Demo de AI Physics: robot autobalanceado que aprende con CEM
```

No necesita compilación ni dependencias: Three.js y las fuentes se cargan desde CDN.

## Ver en local

```bash
python -m http.server 8000
```

Luego abre http://localhost:8000.

## Despliegue en Vercel

Importa este repositorio en Vercel con el preset **Other**, sin comando de build y con el directorio de salida en la raíz. Cada push a `main` publica una nueva versión.

Cuando cambies CSS o JS, sube el número de versión (`?v=2`) en `index.html` para que los navegadores descarguen los archivos nuevos.

## Editar los modelos CAD

Cada diseño está en el objeto `DESIGNS` de `assets/js/blueprint.js`. Cada pieza tiene número, nombre (`n`), material (`m`), proceso (`p`), cantidad (`q`) y dirección de explosión (`ex`). Los modelos de cohete, rover, brazo y robot de fútbol son estudios de diseño; el módulo HER-DS1 es conceptual.
