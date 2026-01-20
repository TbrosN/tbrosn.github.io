# Getting Started with Your XR Portfolio

Welcome! This guide will get you from zero to a running portfolio in **under 5 minutes**.

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open in browser
# Visit http://localhost:3000
```

**That's it!** Your portfolio is now running locally.

## 🎮 Your First Experience

1. **Click "Enter Experience"** on the welcome screen
2. **Move around** with `W` `A` `S` `D` keys
3. **Look around** by moving your mouse
4. **Click on the colorful cubes** to grab them
5. **Click again** to throw them

**Optional:** Click "Enable Hand Tracking" to try gesture controls!

## 📁 Project Overview

You now have a complete 3D portfolio with:

```
✅ First-person 3D navigation
✅ Physics-based object interaction  
✅ Hand tracking with gestures
✅ Animated portfolio content
✅ Performance optimization
✅ Production-ready deployment config
```

## 🎨 Customize Your Portfolio

### 1. Update Your Information

**Edit:** `src/world/PortfolioContent.ts`

```typescript
// Change your name and title
this.addTextPlane(card, 'YOUR NAME', 0, 0.8, 0.06, 0.3);
this.addTextPlane(card, 'Your Job Title', 0, 0.3, 0.06, 0.2);
```

### 2. Add Your Projects

**Edit:** `src/world/PortfolioContent.ts` (line ~40)

```typescript
const projects = [
  { name: 'Your Project 1', position: { x: -4, z: -3 }, color: 0xff6b6b },
  { name: 'Your Project 2', position: { x: 0, z: -3 }, color: 0x4ecdc4 },
  { name: 'Your Project 3', position: { x: 4, z: -3 }, color: 0xffe66d },
];
```

### 3. Update Your Skills

**Edit:** `src/world/PortfolioContent.ts` (line ~100)

```typescript
const skills = [
  'JavaScript',
  'Three.js',
  'React',
  'WebGL',
  'TypeScript',
  'Node.js',
];
```

### 4. Update Meta Information

**Edit:** `index.html`

```html
<meta name="author" content="Your Name">
<meta property="og:title" content="Your Name - Portfolio">
```

**Edit:** `README.md`

Update contact info at the bottom.

## 🚀 Deploy Your Portfolio

### Option 1: GitHub Pages (Easiest)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/githubio.git
git push -u origin main
```

2. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`
   - GitHub Actions will auto-deploy!

3. **Visit your site:**
   `https://yourusername.github.io/githubio/`

### Option 2: Vercel (Fastest)

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Connect your GitHub repo
4. Click "Deploy"

Done! Vercel gives you a live URL instantly.

### Option 3: Netlify

1. `npm run build`
2. Drag the `dist/` folder to [netlify.com/drop](https://app.netlify.com/drop)
3. Site is live!

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for detailed instructions.

## 📚 Learn More

### Documentation

| File | Purpose |
|------|---------|
| **QUICKSTART.md** | Detailed 5-minute setup |
| **README.md** | Full feature documentation |
| **FEATURES.md** | Feature showcase with examples |
| **DEPLOYMENT.md** | All deployment options |
| **CONTRIBUTING.md** | Architecture & development guide |
| **PROJECT_SUMMARY.md** | Complete implementation overview |

### Key Files to Know

| File | What It Does |
|------|--------------|
| `src/main.ts` | Application entry point |
| `src/world/PortfolioContent.ts` | **← Edit this for content** |
| `src/core/Scene.ts` | Lighting and environment |
| `index.html` | HTML structure and UI |
| `vite.config.ts` | Build configuration |

## 🎯 Common Tasks

### Change Colors

**Edit:** `src/world/PortfolioContent.ts`

```typescript
// Colors are in hex: 0xRRGGBB
color: 0xff6b6b,  // Red
color: 0x4ecdc4,  // Cyan  
color: 0xffe66d,  // Yellow
```

### Adjust Camera

**Edit:** `src/core/Camera.ts`

```typescript
this.camera.position.set(0, 1.6, 5);  // Starting position
// x: left/right, y: up/down, z: forward/back
```

### Change Movement Speed

**Edit:** `src/player/PlayerController.ts`

```typescript
private speed: number = 5.0;  // Increase for faster movement
```

### Disable Shadows (Performance)

**Edit:** `src/core/Renderer.ts`

```typescript
this.renderer.shadowMap.enabled = false;  // Disable shadows
```

### Change Background Color

**Edit:** `src/core/Scene.ts`

```typescript
this.scene.background = new THREE.Color(0x1a1a2e);  // Dark blue
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
npm run dev -- --port 3001
```

### Hand Tracking Not Working

- ✅ Make sure you're on HTTPS or localhost
- ✅ Allow camera permissions when prompted
- ✅ Try Chrome or Firefox (best support)

### Low FPS

- Close other browser tabs
- Disable shadows (see above)
- Check GPU usage in Task Manager

### Build Fails

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 💡 Tips & Tricks

### Development

- **Hot Reload** - Changes appear instantly (no page refresh)
- **TypeScript** - Get instant error checking
- **Console Logs** - Press F12 to see debug info

### Controls

- Press `ESC` to exit pointer lock
- Click anywhere to re-enter
- Watch the FPS counter (top-left)

### Hand Tracking

- Works best in good lighting
- Keep hand 1-2 feet from camera
- Pinch slowly and deliberately at first

### Performance

- Check FPS counter in top-left
- Target is 60 FPS
- Below 30 FPS indicates issues

## 🎓 Next Steps

1. ✅ **Customize your content** (projects, skills, about)
2. ✅ **Test on different devices** (mobile, tablet, desktop)
3. ✅ **Deploy to the web** (GitHub Pages, Vercel, Netlify)
4. ✅ **Share with recruiters** (it's impressive!)

## 📞 Need Help?

- **Check the docs** - See documentation files above
- **Console logs** - Press F12 to see errors
- **GitHub Issues** - Report bugs or ask questions

## 🎉 You're Ready!

You now have:
- ✅ A working 3D portfolio
- ✅ All the documentation you need
- ✅ Deployment configurations ready
- ✅ A project that demonstrates XR expertise

**Go customize it and make it yours!**

---

**Made with ❤️ and Three.js**

Questions? Check [README.md](README.md) for comprehensive docs.
