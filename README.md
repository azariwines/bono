# Bono Etiquetas — Azari Wines

App interna para el bono grupal por etiquetas. Sitio estático + una función serverless para el asistente de IA.

## Archivos
- `index.html` — la app. Lee en vivo el CSV publicado del Dashboard (constante `LIVE_CSV`).
- `data.js` — ventas por vendedor del mes + historial de compradores por etiqueta (CRM Airtable). Se regenera a pedido.
- `catalog.js` — catálogo STOCK 2026: bodega, precio, gama y varietal de cada etiqueta.
- `api/ask.js` — función de Vercel que responde las preguntas del botón "Preguntale a la IA" usando la API de Anthropic.
- `vercel.json` — configuración de la función.
- `logo-*.png` — logos.

## Deploy en Vercel
1. Subir estos archivos a la raíz del repo (la carpeta `api/` con `ask.js` adentro).
2. Vercel importa el repo y despliega solo con cada commit.
3. Para la IA: en Vercel → Settings → Environment Variables → agregar `ANTHROPIC_API_KEY` con una clave de https://console.anthropic.com (y redeploy).
   Opcional: `ANTHROPIC_MODEL` para cambiar el modelo (por defecto `claude-sonnet-5-5`).

## Cambiar de mes
Publicar la pestaña nueva como CSV, reemplazar `LIVE_CSV` en `index.html` y regenerar `data.js`.
