# Bono Etiquetas — Azari Wines

App interna para el bono grupal por etiquetas. Sitio estático + una función serverless para el asistente de IA.

## Archivos
- `index.html` — la app. Lee en vivo el CSV publicado del Dashboard (constante `LIVE_CSV`).
- `data.js` — foto del CRM: compradores por etiqueta para TODO el catálogo (no sólo las del bono), clientes, ventas por vendedor del mes y la fecha de la foto (`pulled`). Se regenera cada tanto (al cambiar de mes, o para refrescar la lista de precios); entre medio, `api/delta.js` completa lo nuevo.
- `catalog.js` — catálogo STOCK 2026: bodega, precio, gama y varietal de cada etiqueta.
- `api/ask.js` — función de Vercel que responde las preguntas del botón "Preguntale a la IA" usando la API de Anthropic.
- `api/contacts.js` — función de Vercel que guarda/lee los contactos marcados en la tabla "Contactos Bono" de Airtable (registro compartido).
- `api/delta.js` — función de Vercel que trae de Airtable las ventas y clientes creados después de la foto de `data.js`, así los compradores por etiqueta están al día sin regenerar nada.
- `logo-*.png` — logos.

## Deploy en Vercel
1. Subir estos archivos a la raíz del repo (la carpeta `api/` con `ask.js` adentro).
2. Vercel importa el repo y despliega solo con cada commit.
3. Para la IA: en Vercel → Settings → Environment Variables → agregar `ANTHROPIC_API_KEY` con una clave de https://console.anthropic.com (y redeploy).
   Opcional: `ANTHROPIC_MODEL` para cambiar el modelo (por defecto `claude-sonnet-5-5`).
4. Para el registro compartido de contactos: variable `AIRTABLE_TOKEN` (token personal de Airtable con permisos data.records:read y data.records:write sobre la base "Azari Wines | CRM"). Opcionales: `AIRTABLE_BASE`, `AIRTABLE_TABLE`.

## Cambiar de mes
Publicar la pestaña nueva como CSV, reemplazar `LIVE_CSV` en `index.html` y regenerar `data.js`.
