# Quick Start Guide

Get your XR portfolio running in 5 minutes!

## Prerequisites

- **Node.js** 16+ ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- A modern browser (Chrome, Firefox, Edge)

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Three.js (3D engine)
- Rapier (physics)
- GSAP (animations)
- MediaPipe (hand tracking)
- Vite (build tool)

### 2. Start Development Server

```bash
npm run dev
```

Opens at http://localhost:3000

### 3. Open in Browser

Navigate to the URL shown in terminal (usually http://localhost:3000)

## First Experience

1. **Click "Enter Experience"** - Starts the 3D environment
2. **Allow pointer lock** - Browser will ask to capture mouse
3. **Move around** - Use WASD keys
4. **Look around** - Move your mouse
5. **Grab objects** - Click on the colored cubes

## Optional: Try Hand Tracking

1. **Click "Enable Hand Tracking"** button
2. **Allow camera access** when browser prompts
3. **Position your hand** in view of webcam
4. **Pinch** (thumb + index finger together) to grab
5. **Release** (open hand) to drop

## What You're Seeing

### The Environment
- **Ground plane** with grid
- **Colored cubes** (interactive - you can grab these!)
- **Central display** with your portfolio title
- **Project pedestals** with floating icons
- **Skills wall** on the back
- **Timeline spiral** on the right

### Controls Summary
| Key/Action | Function |
|------------|----------|
| W A S D | Move forward/left/back/right |
| Mouse | Look around |
| Left Click | Grab/release objects |
| ESC | Exit pointer lock |

## Customizing Your Portfolio

### Quick Customization

1. **Edit portfolio content:**
```bash
open src/world/PortfolioContent.ts
```

Change project names, colors, and descriptions.

2. **Update about info:**
Find the `createAboutSection()` method and update:
```typescript
this.addTextPlane(card, 'YOUR NAME', 0, 0.8, 0.06, 0.3);
this.addTextPlane(card, 'Your Title', 0, 0.3, 0.06, 0.2);
```

3. **Modify skills:**
Edit the `skills` array in `createSkillsWall()`:
```typescript
const skills = [
  'Your Skill 1',
  'Your Skill 2',
  // ... etc
];
```

### Full Customization

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture details.

## Building for Production

```bash
npm run build
```

Creates optimized files in `dist/` folder.

## Deploying

### GitHub Pages (easiest)

1. Push your code to GitHub
2. Enable GitHub Actions in settings
3. Push to main branch
4. Site deploys automatically!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Troubleshooting

### "npm install" fails
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Port 3000 already in use
```bash
# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill

# Or use different port
npm run dev -- --port 3001
```

### Browser won't let me use hand tracking
- **Make sure you're on HTTPS** (or localhost)
- Hand tracking requires secure context
- Try Chrome/Firefox (best support)

### Low FPS / Laggy
- Close other tabs/applications
- Disable shadows in `src/core/Scene.ts`
- Lower pixel ratio in `src/core/Renderer.ts`

### Objects falling through floor
- Check if physics initialized (see console)
- Verify Rapier WASM loaded correctly

## Next Steps

1. **Customize content** - Make it yours!
2. **Add your projects** - Edit `PortfolioContent.ts`
3. **Test on devices** - Mobile, tablet, desktop
4. **Deploy** - Share with the world!

## Getting Help

- **Console logs** - Press F12 to see debug info
- **README.md** - Full documentation
- **CONTRIBUTING.md** - Architecture guide
- **GitHub Issues** - Report bugs

## Pro Tips

### Development
```bash
# Preview production build locally
npm run build && npm run preview
```

### Performance
- Check FPS counter (top-left)
- Use Chrome DevTools Performance tab
- Monitor console for warnings

### Hand Tracking
- Works best in good lighting
- Position hand 1-2 feet from camera
- Keep fingers clearly visible
- Try pinching slowly at first

## Common Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production
npm run preview       # Preview production build

# Utilities
npm list              # List installed packages
npm outdated          # Check for updates
npx tsc --noEmit      # Type check without building
```

## Resources

- [Three.js Docs](https://threejs.org/docs/)
- [Rapier Physics](https://rapier.rs/docs/)
- [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)
- [Vite Guide](https://vitejs.dev/guide/)

---

**Ready to build something amazing? Let's go! 🚀**

Questions? Open an issue or check the full README.md
