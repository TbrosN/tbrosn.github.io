## Trey Brosnan's Portfolio

You can visit my portfolio website at https://treybrosnan.com.

### About me

I'm a fourth-year undergraduate at <a href="https://www.cmu.edu/" target="_blank" rel="noreferrer"><strong>Carnegie Mellon University</strong></a> studying computer science and math.

I'm also a Software Engineer at <a href="https://creativemode.net/" target="_blank" rel="noreferrer"><strong>CreativeMode (YC S24)</strong></a>, where I'm building coding agents for gaming.

I'm passionate about using **AI to lower barriers for creative expression.**

<p align="left">
  <a href="mailto:treyb@cmu.edu" target="_blank" rel="noreferrer" title="Email" style="text-decoration: none; margin-right: 8px;">
    <img src="https://api.iconify.design/material-symbols:mail.svg?color=%23D14836&width=32&height=32" alt="Email" style="vertical-align: middle;" />
  </a>
  <a href="https://github.com/tbrosn" target="_blank" rel="noreferrer" title="GitHub" style="text-decoration: none; margin-right: 8px;">
    <img src="https://api.iconify.design/simple-icons:github.svg?color=%23181717&width=32&height=32" alt="GitHub" style="vertical-align: middle;" />
  </a>
  <a href="https://linkedin.com/in/trey-brosnan" target="_blank" rel="noreferrer" title="LinkedIn" style="text-decoration: none; margin-right: 8px;">
    <img src="https://api.iconify.design/simple-icons:linkedin.svg?color=%230A66C2&width=32&height=32" alt="LinkedIn" style="vertical-align: middle;" />
  </a>
  <a href="https://open.spotify.com/artist/50K7zuQx7W5vF9B6o6ABY1?si=SCy7Kdu5RIaHhWJrE8RALg" target="_blank" rel="noreferrer" title="Spotify" style="text-decoration: none;">
    <img src="https://api.iconify.design/simple-icons:spotify.svg?color=%231DB954&width=32&height=32" alt="Spotify" style="vertical-align: middle;" />
  </a>
</p>

### About this repo

This site is a **Three.js interactive game** (TypeScript + Vite) with:

- **3D rendering** via `three`
- **Physics** via `@dimforge/rapier3d-compat` (with a post-build WASM copy step)
- **Hand tracking** via MediaPipe (`@mediapipe/hands`)

Core code lives in `src/` (rendering, player controls, interactions, and world content).

### Acknowledgments

- **Inspiration**: This project was inspired by Bruno Simon's amazing portfolio, <a href="https://bruno-simon.com/" target="_blank" rel="noreferrer">bruno-simon.com</a>.
- **AI**: I used **Cursor** to assist with building this site.

### Development

```bash
npm install
npm run dev
```
