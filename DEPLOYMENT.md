# Deployment — VPS (NGINX, HTTP/2, Brotli)

Master Beauty Academy is a fully static Astro 6 build. The deployment target is a Linux VPS running NGINX with Brotli and Let's Encrypt TLS.

## 1. Local build

```bash
npm ci
npm run build       # outputs ./dist (static HTML/CSS/JS)
```

`dist/` is everything that needs to be served. It contains:
- Pre-rendered HTML for every route
- Hashed CSS/JS in `_assets/`
- Sitemap (`sitemap-index.xml`, `sitemap-0.xml`)
- `rss.xml`, `robots.txt`, favicon, OG images

## 2. Server prerequisites

```bash
sudo apt update
sudo apt install -y nginx libnginx-mod-brotli certbot python3-certbot-nginx
```

(If your distro doesn't ship `libnginx-mod-brotli`, build it from `google/ngx_brotli` or use the official Cloudflare-maintained module.)

## 3. Upload the build

```bash
rsync -avz --delete dist/ user@your-vps:/var/www/masterbeautyacademy/dist/
```

Make sure the directory is readable by NGINX:

```bash
sudo chown -R www-data:www-data /var/www/masterbeautyacademy
sudo find /var/www/masterbeautyacademy -type d -exec chmod 755 {} \;
sudo find /var/www/masterbeautyacademy -type f -exec chmod 644 {} \;
```

## 4. NGINX configuration

Copy `nginx.conf` from this repo to `/etc/nginx/conf.d/masterbeautyacademy.conf`, then:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. TLS (Let's Encrypt)

```bash
sudo certbot --nginx -d themasterbeautyacademy.com -d www.themasterbeautyacademy.com
sudo systemctl enable --now certbot.timer
```

Certbot edits the SSL paths automatically. Keep `ssl_protocols TLSv1.2 TLSv1.3` and HSTS.

## 6. HTTP/3 (optional)

Enable HTTP/3 either with NGINX QUIC builds or by fronting NGINX with Cloudflare. The site is fully cache-friendly: every `_assets/*` file is content-hashed and served with `Cache-Control: public, max-age=31536000, immutable`.

## 7. Continuous deployment

Recommended CI flow (GitHub Actions or similar):

```yaml
# .github/workflows/deploy.yml (sketch)
on: { push: { branches: [main] } }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - name: Deploy
        run: rsync -avz --delete dist/ ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/var/www/masterbeautyacademy/dist/
```

## 8. Performance budget

Target metrics enforced during build review:

| Metric | Target |
| --- | --- |
| Mobile PSI | ≥ 95 |
| Desktop PSI | ≥ 98 |
| LCP | < 1.8s |
| CLS | < 0.05 |
| INP | < 150ms |
| Total JS (initial) | < 30 KB gzipped |

Run after every release:

```bash
npx unlighthouse --site https://themasterbeautyacademy.com
```

## 9. Monitoring & SEO

- **Google Search Console** — verify both `https://themasterbeautyacademy.com` and submit `sitemap-index.xml`.
- **Google Analytics 4** — install via a single `<script async>` in `BaseLayout.astro` (replace placeholder).
- **PageSpeed Insights** — schedule weekly tracking via the API.
- **Bing Webmaster Tools** — submit the same sitemap.

## 10. Local content workflow

To add a blog post, drop a new `.mdx` file into `src/content/blog/` with frontmatter (see `what-is-a-beautician-course.mdx` as the template). Astro automatically:

- adds it to the blog index
- generates Article + FAQ schema
- includes it in the sitemap and RSS feed
- builds its detail page at `/blog/<slug>`

No rebuild config needed — just `npm run build`.
