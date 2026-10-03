# MARS: 2187

**THE PLANET REMEMBERS**

A first-person sci-fi exploration and survival browser game set on Mars in the year 2187.

---

## Game Concept

You are a systems engineer aboard the Asterion descent vehicle. The Aurelia colony on Mars has gone silent. Your mission: land, restore power, investigate the disappearance — and uncover what lies beneath the surface of Mars.

MARS: 2187 combines first-person exploration, engineering puzzles, environmental storytelling, and a mysterious sci-fi narrative across five chapters.

---

## Controls

| Key | Action |
|-----|--------|
| W / A / S / D | Move |
| SHIFT | Sprint |
| SPACE | Jump |
| Mouse | Look |
| E | Interact |
| F | Flashlight |
| M | Mission interface |
| I | Inventory / Systems |
| ESC | Pause menu |

**Rover Mode:**
| Key | Action |
|-----|--------|
| W / A / S / D | Drive |
| SPACE | Emergency brake |
| E | Exit rover |

---

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run check

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Build

```bash
npm run build
```

Output directory: `dist/`

---

## Cloudflare Pages Deployment

| Setting | Value |
|---------|-------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

No environment variables required. Fully static deployment.

---

## Architecture

```
src/
  main.ts              # Entry point
  core/                # Game loop, state, input, events, assets, save
  rendering/           # Three.js renderer, lighting, post-processing, environment
  player/              # Player controller, interaction, suit system
  world/               # Mars terrain, Aurelia colony, Helios Deep, world objects
  rover/               # M-7 rover controller and scanner
  systems/             # Mission, puzzle, terminal, lore, storm, cinematic systems
  ui/                  # HUD, menus, terminal UI, archive, settings
  audio/               # Procedural Web Audio synthesis
  content/             # Story data, missions, lore, dialogue
```

---

## Performance Notes

- Targets 60 FPS on modern desktop hardware
- Uses Three.js instanced meshes for terrain decoration
- Procedural geometry — no external model files required
- Procedural Web Audio — no external audio files required
- Graphics quality settings (Low / Medium / High / Ultra)
- Frustum culling enabled
- Limited shadow casters

---

## Known Limitations

- Mobile devices: displays desktop recommendation; touch controls not implemented
- Firefox: minor visual differences in post-processing
- WebGL 1.0 only devices: bloom disabled, reduced quality

---

## Credits

**MARS: 2187**
Built with Three.js + TypeScript + Vite
Procedural audio via Web Audio API
All geometry and textures generated procedurally at runtime

*No external copyrighted assets used.*

---

*MARS: 2187 — The Planet Remembers*
