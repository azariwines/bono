# Bono Etiquetas — Azari Wines

App interna para el bono grupal por etiquetas. Sitio estático: no necesita build ni backend.

## Deploy en Vercel
1. Subir esta carpeta a un repo de GitHub.
2. En Vercel: Add New Project → Import el repo → Framework "Other" → Deploy.

## Archivos
- `index.html` — la app (lee en vivo el CSV publicado del Dashboard; la URL está en la constante `LIVE_CSV`).
- `data.js` — ventas por vendedor del mes + historial de compradores por etiqueta (CRM Airtable). Se regenera a pedido.
- `catalog.js` — catálogo de STOCK 2026: bodega, precio, gama y varietal de cada etiqueta. Se regenera cuando cambian precios.
- `logo-*.png` — logos.

## Cambiar de mes
Publicar la pestaña nueva como CSV y reemplazar `LIVE_CSV` en `index.html`; regenerar `data.js`.
