---
description: "HTML structure rules for the SPA shell and component markup: semantic HTML5, root shell setup, FOUC prevention, no constraining wrappers. Use when editing index.html or generating HTML from page/component TypeScript."
applyTo: "public/index.html, src/pages/**"
---

# HTML Structure

The application uses a **semantic HTML5** structure within a single-page application architecture.

## Root HTML Shell

`public/index.html` serves as the SPA shell:
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Theme initialization script **inline** (before CSS loads) to prevent FOUC (flash of unstyled content)
- CSS files loaded in order: base → variables → themes → layout → components → animations → utilities
- Main application container: `<div id="app"></div>`
- TypeScript bundle loaded with `defer` attribute

## Semantic Structure

Components generate semantic HTML:
- `<main>` for primary content area
- `<nav>` for navigation sidebar/header
- `<section>` for dashboard regions
- `<article>` for individual agent cards (Bento boxes)
- `<table>` for tabular data (with responsive card fallback)
- `<form>` for login and search inputs
- `<button>` for all interactive actions (not `<div>` with click handlers)

## No Constraining Wrappers

Avoid nested container divs that artificially limit content width. **Exception**: login page can have a centered constrained card for better UX.
