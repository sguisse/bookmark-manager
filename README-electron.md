# Electron mode

Run the app in Electron during development:

```bash
npm run dev:electron
```

This script starts the Vite dev server and then launches Electron pointed at the dev URL.

To build a production Electron bundle (simple):

```bash
npm run electron:prod
```

This will build the Vite app and then launch electron loading the built files. For full packaging into a distributable, consider using `electron-builder` or `electron-forge`.
