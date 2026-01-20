# Interactive XR-Inspired 3D Portfolio

A cutting-edge, Bruno Simon-inspired 3D portfolio website featuring XR-style interactions, webcam-based hand tracking, and immersive spatial navigation.

![Portfolio Demo](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Three.js](https://img.shields.io/badge/Three.js-0.160.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.11-purple)

## 🌟 Features

### Core Experience
- **3D First-Person Navigation** - WASD movement with mouse-look camera controls
- **Physics-Based Interactions** - Rapier physics engine for realistic object behavior
- **XR-Style Grabbing** - Pick up, move, and throw objects with satisfying physics
- **Hand Tracking** - Optional webcam-based hand gesture controls via MediaPipe
- **Spatial Portfolio** - Projects and content embedded as interactive 3D elements

### Technical Highlights
- ⚡ **60 FPS Performance** - Optimized rendering pipeline
- 📱 **Cross-Device Support** - Adaptive quality for mobile/desktop
- 🎨 **Modern Graphics** - PBR materials, shadows, and post-processing
- 🎯 **Zero Dependencies** - Vanilla Three.js (no React overhead)
- 🚀 **Fast Load Times** - Code splitting and lazy loading

## 🎮 Controls

| Action | Control |
|--------|---------|
| Move | `W` `A` `S` `D` |
| Look Around | Mouse Movement |
| Grab/Release | Left Click |
| Exit Pointer Lock | `ESC` |
| Hand Tracking | Toggle via UI button |

### Hand Gestures (Beta)
- **Pinch** (thumb + index together) - Grab object
- **Release** (open hand) - Drop object

## 🛠️ Tech Stack

- **3D Engine:** Three.js
- **Physics:** Rapier (WASM)
- **Animation:** GSAP
- **Hand Tracking:** MediaPipe Hands
- **Build Tool:** Vite
- **Language:** TypeScript

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

```
src/
├── core/               # Core engine systems
│   ├── Renderer.ts     # WebGL renderer wrapper
│   ├── Scene.ts        # Scene setup & lighting
│   ├── Camera.ts       # First-person camera
│   └── Time.ts         # Delta time management
├── player/             # Player controls
│   ├── InputManager.ts # Keyboard/mouse input
│   └── PlayerController.ts # Movement & physics
├── physics/            # Physics simulation
│   └── PhysicsWorld.ts # Rapier integration
├── interaction/        # Object interaction
│   ├── Raycaster.ts    # Ray-based selection
│   └── GrabSystem.ts   # Grab mechanics
├── handtracking/       # Hand tracking system
│   ├── HandTracker.ts  # MediaPipe wrapper
│   ├── HandMapper.ts   # Hand → 3D mapping
│   ├── GestureDetector.ts # Pinch detection
│   └── HandInteractionSystem.ts # Integration
├── world/              # World building
│   ├── World.ts        # Environment setup
│   └── PortfolioContent.ts # Portfolio elements
├── utils/              # Utilities
│   ├── DeviceDetector.ts # Device capabilities
│   └── PerformanceMonitor.ts # FPS tracking
├── ui/                 # UI overlays
│   └── UI.ts          # HUD and onboarding
└── main.ts            # Application entry point
```

## 🎨 Customization

### Adding Portfolio Content

Edit `src/world/PortfolioContent.ts` to customize:
- Projects and their positions
- Skills displayed on the wall
- Timeline elements
- About section content

### Adjusting Physics

Modify `src/physics/PhysicsWorld.ts`:
```typescript
const gravity = { x: 0.0, y: -9.81, z: 0.0 }; // Adjust gravity
```

### Performance Tuning

Edit `src/utils/DeviceDetector.ts` to customize settings per device tier:
```typescript
getRecommendedSettings(): {
  pixelRatio: number;
  shadowMapSize: number;
  enableHandTracking: boolean;
  antialias: boolean;
}
```

## 🚀 Deployment

### GitHub Pages

1. Update `vite.config.ts` base path:
```typescript
base: '/your-repo-name/'
```

2. Build and deploy:
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

### Vercel/Netlify

Simply connect your repository - Vite builds are auto-detected.

## 🔧 Development

### Hot Module Replacement

Vite provides instant HMR for rapid development:
```bash
npm run dev
```

### Type Checking

TypeScript strict mode enabled:
```bash
npx tsc --noEmit
```

### Performance Profiling

Press `F12` in browser and check:
- FPS counter (top-left HUD)
- Chrome DevTools > Performance tab
- Three.js Stats (optional)

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Safari 14+ | ⚠️ Limited hand tracking |
| Edge 90+ | ✅ Full support |

**Hand tracking requires:**
- HTTPS or localhost
- Camera permissions
- Modern browser with WebRTC support

## 🐛 Troubleshooting

### Hand tracking not working

1. Check camera permissions in browser
2. Ensure HTTPS connection (required for camera access)
3. Try in Chrome/Firefox (best support)
4. Check console for MediaPipe errors

### Low FPS

1. Check GPU tier in console logs
2. Disable shadows in `Scene.ts`
3. Reduce `pixelRatio` in `Renderer.ts`
4. Close other GPU-intensive applications

### Physics glitches

1. Ensure WASM support in browser
2. Check Rapier initialization in console
3. Verify collider sizes in `PhysicsWorld.ts`

## 🎯 Roadmap

- [ ] Full WebXR headset support
- [ ] Multiplayer/shared spaces
- [ ] Advanced particle effects
- [ ] Audio integration
- [ ] More gesture types
- [ ] Mobile touch controls
- [ ] Project detail modals

## 📄 License

MIT License - Feel free to use this as a template for your own portfolio!

## 🙏 Acknowledgments

- Inspired by [Bruno Simon's portfolio](https://bruno-simon.com/)
- Built with [Three.js](https://threejs.org/)
- Physics by [Rapier](https://rapier.rs/)
- Hand tracking by [MediaPipe](https://mediapipe.dev/)

## 📞 Contact

**Your Name**
- Portfolio: [your-site.com](https://your-site.com)
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Name](https://linkedin.com/in/yourname)

---

**Built with ❤️ and Three.js**
