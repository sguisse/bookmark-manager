# Nginx / OpenResty Dev Proxy

Alternative to the Node `server/proxy.js` for embedding external pages in iframes during local development.

## Features

- Dynamic target: `/proxy?url=https://example.com/path`
- Strips `X-Frame-Options` (proxy_hide_header)
- Injects permissive `frame-ancestors *` CSP (adds header)
- Optional injection of a small script via `?inject=1` (uses `sub_filter`)
- Permissive CORS headers
- Disables upstream compression to allow sub_filter rewrite

## Limitations

- `sub_filter` only works on uncompressed text; large or chunked pages may not always inject where desired.
- Does not rewrite fetch/XHR at this stage (script example is placeholder).
- CSP modifications are additive; existing CSP may still restrict resources except for frame-ancestors override.

## Requirements

- OpenResty (recommended) or Nginx compiled with `ngx_http_sub_module`.

## Quick Start (Docker)

Create `docker-compose.yml`:

```yaml
services:
  dev-proxy:
    image: openresty/openresty:alpine
    ports:
      - "8080:8080"
    volumes:
      - ./proxy-nginx/nginx.conf:/usr/local/openresty/nginx/conf/nginx.conf:ro
```

Then run:

```bash
docker compose up -d
```

Test:

```bash
curl -I 'http://localhost:8080/proxy?url=https://example.com/'
```

With injection:

```bash
curl -s 'http://localhost:8080/proxy?url=https://example.com/&inject=1' | grep nginx\\ inject
```

## Next Enhancements

- Lua-based body filter for robust streaming JS injection & request rewriting.
- Host allowlist via env variable mapping (e.g. using envsubst or templated config).
- Cache small assets (favicon, CSS) for speed.

## When to choose this

Use the Nginx approach if the Node middleware approach is unstable or you prefer an external reverse proxy layer that can later be shared across projects.
