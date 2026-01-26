## Trey Brosnan's Portfolio

You can visit my portfolio website at https://treybrosnan.com.

### About me

I’m a fourth-year undergraduate at [**Carnegie Mellon University**](https://www.cmu.edu/) studying computer science and math.

I’m also a Software Engineer at [**CreativeMode (YC S24)**](https://creativemode.net/), where I’m building coding agents for gaming.

I’m passionate about using **AI to lower barriers for creative expression.**

<p align="left">
  <a href="mailto:treyb@cmu.edu" target="_blank" rel="noreferrer" title="Email">
    <img src="https://api.iconify.design/material-symbols:mail.svg?color=%23D14836&width=32&height=32" alt="Email" />
  </a>
  <a href="https://github.com/tbrosn" target="_blank" rel="noreferrer" title="GitHub">
    <img src="https://api.iconify.design/simple-icons:github.svg?color=%23181717&width=32&height=32" alt="GitHub" />
  </a>
  <a href="https://linkedin.com/in/trey-brosnan" target="_blank" rel="noreferrer" title="LinkedIn">
    <img src="https://api.iconify.design/simple-icons:linkedin.svg?color=%230A66C2&width=32&height=32" alt="LinkedIn" />
  </a>
  <a href="https://open.spotify.com/artist/50K7zuQx7W5vF9B6o6ABY1?si=SCy7Kdu5RIaHhWJrE8RALg" target="_blank" rel="noreferrer" title="Spotify">
    <img src="https://api.iconify.design/simple-icons:spotify.svg?color=%231DB954&width=32&height=32" alt="Spotify" />
  </a>
</p>

### About this repo

This site is a **Three.js interactive game** (TypeScript + Vite) with:

- **3D rendering** via `three`
- **Physics** via `@dimforge/rapier3d-compat` (with a post-build WASM copy step)
- **Hand tracking** via MediaPipe (`@mediapipe/hands`)

Core code lives in `src/` (rendering, player controls, interactions, and world content).

### Acknowledgments

- **Inspiration**: This project was inspired by Bruno Simon’s amazing portfolio, [bruno-simon.com](https://bruno-simon.com/).
- **AI**: I used **Cursor** to assist with building this site.

### Development

```bash
npm install
npm run dev
```
