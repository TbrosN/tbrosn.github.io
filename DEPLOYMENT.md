# Deployment Guide

## Quick Deploy Options

### Option 1: GitHub Pages (Recommended for GitHub.io)

1. **Update base path in `vite.config.ts`:**
```typescript
export default defineConfig({
  base: '/githubio/',  // Your repo name
  // ... rest of config
});
```

2. **Build the project:**
```bash
npm run build
```

3. **Deploy to gh-pages branch:**

Using GitHub Actions (recommended):

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Or manually:
```bash
# Install gh-pages utility
npm install -g gh-pages

# Deploy
gh-pages -d dist
```

4. **Configure GitHub Pages:**
   - Go to repository Settings > Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` / `root`
   - Save

### Option 2: Vercel

1. **Connect repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite

2. **Configure (usually auto-detected):**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy:**
   - Push to main branch
   - Auto-deploys on each commit

### Option 3: Netlify

1. **Connect repository:**
   - Go to [netlify.com](https://netlify.com)
   - New site from Git
   - Select your repository

2. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Optional - Add `netlify.toml`:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 4: Custom Server (VPS/Cloud)

1. **Build:**
```bash
npm run build
```

2. **Upload `dist/` folder to your server**

3. **Configure web server (Nginx example):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/portfolio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

4. **For HTTPS (required for hand tracking):**
```bash
# Using Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

## Environment-Specific Configurations

### Development
```bash
npm run dev
```
- Hot reload enabled
- Source maps available
- Runs on http://localhost:3000

### Preview Production Build
```bash
npm run build
npm run preview
```
- Test production build locally
- Runs on http://localhost:4173

### Production Considerations

#### 1. HTTPS Required for Hand Tracking
Hand tracking requires secure context (HTTPS). Ensure your deployment supports HTTPS.

#### 2. Base Path
If deploying to subdirectory, update `vite.config.ts`:
```typescript
base: '/subdirectory/'
```

#### 3. Asset Optimization
Current bundle is ~2.6MB (898KB gzipped). To optimize:

**Code splitting:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'physics': ['@dimforge/rapier3d-compat'],
          'hand-tracking': ['@mediapipe/hands', '@mediapipe/camera_utils'],
        }
      }
    }
  }
});
```

**Lazy loading:**
```typescript
// Only load hand tracking when needed
const HandTracker = await import('./handtracking/HandTracker');
```

#### 4. CDN for Static Assets
Consider using a CDN for:
- MediaPipe models (already using jsDelivr)
- 3D models/textures (if added)

## Post-Deployment Checklist

- [ ] Site loads in all major browsers
- [ ] WASD movement works
- [ ] Mouse look is responsive
- [ ] Objects can be grabbed and thrown
- [ ] Hand tracking button appears (desktop only)
- [ ] Camera permissions prompt works
- [ ] FPS counter shows 60fps
- [ ] No console errors
- [ ] Mobile devices show appropriate UI
- [ ] HTTPS enabled (for hand tracking)

## Troubleshooting Deployment

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 404 on Routes
Ensure your server is configured for SPA routing (all routes serve `index.html`).

### Assets Not Loading
Check `base` path in `vite.config.ts` matches your deployment URL structure.

### Performance Issues
- Enable gzip/brotli compression on server
- Use CDN for static assets
- Implement code splitting
- Consider lazy loading heavy dependencies

## Monitoring

### Analytics
Add analytics to `index.html` before `</body>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-ID');
</script>
```

### Error Tracking
Consider adding Sentry or similar:
```bash
npm install @sentry/browser
```

```typescript
// main.ts
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "YOUR-SENTRY-DSN",
  environment: "production",
});
```

## Custom Domain

### GitHub Pages
1. Add `CNAME` file to `public/` folder:
```
your-domain.com
```

2. Configure DNS:
```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   yourusername.github.io
```

### Vercel/Netlify
Add domain in platform settings - they handle DNS automatically.

---

Need help? Check the main README.md or open an issue.
