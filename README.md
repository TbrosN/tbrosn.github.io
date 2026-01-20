# Trey Brosnan - Portfolio Website

A modern, responsive portfolio website showcasing my work as a software engineer, AI/ML researcher, and music producer. Built with vanilla HTML, CSS, and JavaScript following modern web standards and accessibility best practices.

🌐 **Live Site:** [https://treybrosnan.github.io](https://treybrosnan.github.io)

## 🎨 Design Features

- **Bento Box Layout** - Asymmetric grid design inspired by Apple and Linear
- **Glassmorphism Effects** - Frosted glass UI with backdrop blur
- **Dark/Light Mode** - Persistent theme toggle with system preference detection
- **Scroll Animations** - Performance-optimized Intersection Observer animations
- **Terminal Typewriter** - Cycling role descriptions in hero section
- **Animated Counters** - Impact metrics that count up when scrolled into view
- **Responsive Design** - Mobile-first approach with fluid typography

## 🛠️ Tech Stack

### Core Technologies
- **HTML5** - Semantic markup with ARIA labels
- **CSS3** - CSS Grid, Flexbox, Custom Properties, Animations
- **Vanilla JavaScript** - ES6+, modular architecture, no frameworks

### Modern CSS Features
- CSS Custom Properties (CSS Variables) for theming
- CSS Grid for Bento Box layout
- `clamp()` for fluid, responsive typography
- `backdrop-filter` for glassmorphism effects
- CSS animations and transitions with cubic-bezier easing

### JavaScript APIs Used
- **Intersection Observer API** - Scroll-triggered animations
- **localStorage API** - Theme preference persistence
- **matchMedia API** - System theme preference detection
- **requestAnimationFrame** - Smooth counter animations

## 📁 Project Structure

```
/
├── index.html              # Main HTML file
├── css/
│   ├── reset.css          # CSS normalization
│   ├── variables.css      # CSS custom properties (colors, spacing, themes)
│   ├── layout.css         # Bento box grid, responsive layouts
│   ├── components.css     # Reusable component styles
│   ├── effects.css        # Glassmorphism, gradients, glows
│   └── animations.css     # Scroll animations, keyframes
├── js/
│   ├── theme.js           # Dark/light mode toggle
│   ├── scroll.js          # Scroll animations & smooth scrolling
│   ├── navigation.js      # Mobile menu & navigation
│   ├── typewriter.js      # Terminal typewriter effect
│   ├── counter.js         # Animated metric counters
│   └── main.js            # Main coordinator
├── assets/
│   ├── images/            # Profile photo, project screenshots
│   ├── icons/             # Tech stack badges, social icons
│   └── audio/             # Audio preview clips (optional)
└── README.md              # This file
```

## 🚀 Features

### 1. Theme System
- **Dark mode first** design philosophy
- Persistent theme selection via localStorage
- System preference detection (`prefers-color-scheme`)
- Smooth transitions between themes
- No flash of unstyled content (FOUC)

### 2. Navigation
- Fixed glassmorphism navigation bar
- Active section highlighting
- Smooth scroll to sections
- Mobile hamburger menu
- Keyboard navigation support
- Auto-hide on scroll down, show on scroll up

### 3. Hero Section
- Full viewport height layout
- Terminal typewriter effect cycling through roles
- Gradient text effect on name
- Stats ticker with key metrics
- Dual CTA buttons
- Animated gradient background

### 4. About Section
- Two-column responsive layout
- Circular profile image with glow effect
- Credential badges (YC, CMU, GPA)
- Animated impact metrics (100k+ users, etc.)
- Skills organized by category
- Pill-style skill badges

### 5. Projects Section
- Bento box grid layout (asymmetric)
- Featured project cards span multiple columns
- Hover effects with image zoom
- Glassmorphism overlays
- Tech stack badges
- GitHub and live demo links

### 6. Music Section
- CSS waveform animation
- Platform links (Spotify, SoundCloud)
- Artist bio highlighting AI/music intersection
- Glassmorphism platform cards

### 7. Experience Timeline
- Vertical timeline with gradient connector
- Alternating card positions (desktop)
- Stacked layout (mobile)
- Glassmorphism cards
- Achievement bullet points

### 8. Scroll Animations
- Intersection Observer for performance
- Fade-in and slide-up effects
- Staggered animations for grouped elements
- Respects `prefers-reduced-motion`

## 🎓 Learning & AI Usage

This portfolio was built as a learning project for 15-113 at CMU. I used AI assistance (Claude) throughout development to learn modern web development patterns, best practices, and accessibility standards.

### AI-Assisted Learning Areas:
- **CSS Grid & Flexbox** - Learned responsive layout techniques
- **CSS Custom Properties** - Understanding theming systems
- **Intersection Observer API** - Performance-optimized scroll animations
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation
- **Glassmorphism** - Modern UI effects with backdrop-filter
- **JavaScript Patterns** - Modular architecture, IIFE pattern
- **Performance** - requestAnimationFrame, passive event listeners

### AI Usage Documentation:
Comments throughout the codebase indicate where AI assistance was used:
- `// AI-assisted: [description of what was learned]`
- `/* AI-assisted: [description of what was learned] */`

## 🌟 Highlights

- ✅ **100/100 Lighthouse** scores (target)
- ✅ **WCAG AA Compliant** - Accessibility first
- ✅ **Mobile First** - Responsive on all devices
- ✅ **Performance Optimized** - Lazy loading, efficient animations
- ✅ **No Frameworks** - Pure vanilla JavaScript
- ✅ **Modern CSS** - Grid, custom properties, fluid typography
- ✅ **Semantic HTML** - Proper structure and ARIA labels

## 🎯 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Opera 74+

Note: Some features like `backdrop-filter` may have limited support in older browsers but gracefully degrade.

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1280px

Fluid typography using `clamp()` ensures smooth scaling between breakpoints.

## 🔧 Local Development

1. Clone the repository:
```bash
git clone https://github.com/treybrosnan/treybrosnan.github.io.git
cd treybrosnan.github.io
```

2. Open `index.html` in your browser:
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Or use a local server (recommended)
python3 -m http.server 8000
# Visit http://localhost:8000
```

3. Make changes and refresh to see updates

No build process required - it's just HTML, CSS, and JavaScript!

## 🚢 Deployment

This site is deployed via **GitHub Pages** as a user site:

1. Repository name: `username.github.io`
2. Deploy from `main` branch, root directory
3. Accessible at `https://username.github.io`

### GitHub Pages Setup:
1. Go to repository Settings
2. Navigate to Pages section
3. Select Source: "Deploy from a branch"
4. Branch: `main` / `(root)`
5. Save and wait 1-2 minutes for deployment

## 📊 Performance Optimizations

- **Lazy loading** for images below the fold
- **Intersection Observer** instead of scroll events
- **requestAnimationFrame** for smooth animations
- **Passive event listeners** for better scroll performance
- **CSS custom properties** for instant theme switching
- **Modular JavaScript** for better caching
- **WebP images** for smaller file sizes (when added)
- **Preconnect** to Google Fonts

## ♿ Accessibility Features

- Semantic HTML5 structure
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators on all focusable elements
- Sufficient color contrast (WCAG AA)
- `alt` text on all images
- Skip to main content link (planned)
- Respects `prefers-reduced-motion`
- Screen reader compatible

## 🎨 Design Inspiration

- **Apple** - Bento box grid layout
- **Linear** - Glassmorphism and modern UI
- **Spotify** - Dark mode aesthetic, music integration
- **Adam Argyle (nerdy.dev)** - Technical layouts
- **Modern SaaS Dashboards** - Data visualization

## 📝 Future Enhancements

### Phase 2 (Planned):
- [ ] Spotify Web API integration ("Now Playing")
- [ ] Interactive audio visualizer (Web Audio API)
- [ ] Project filtering by technology
- [ ] Contact form with validation
- [ ] Blog section for technical writing
- [ ] Resume download with analytics
- [ ] Open source contributions graph

### Phase 3 (Ideas):
- [ ] Three.js background effects
- [ ] Particle system in hero
- [ ] Case study pages for major projects
- [ ] Testimonials carousel
- [ ] Achievement system with badges
- [ ] Progressive Web App (PWA) features

## 🐛 Known Issues

None currently! 🎉

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

Feel free to use this as inspiration for your own portfolio, but please don't copy it directly. Create something unique that represents you!

## 👤 Author

**Trey Brosnan**
- Website: [treybrosnan.github.io](https://treybrosnan.github.io)
- GitHub: [@treybrosnan](https://github.com/treybrosnan)
- LinkedIn: [Trey Brosnan](https://linkedin.com/in/treybrosnan)
- Email: tbrosnan@andrew.cmu.edu

## 🙏 Acknowledgments

- **Claude AI** - For teaching me modern web development patterns
- **CMU 15-113** - For the assignment and learning opportunity
- **MDN Web Docs** - For excellent web standards documentation
- **CSS-Tricks** - For CSS Grid and Flexbox guides
- **Google Fonts** - For the Inter and JetBrains Mono fonts

---

Built with ❤️ using vanilla HTML, CSS, and JavaScript
