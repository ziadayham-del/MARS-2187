import { Game } from './core/Game.js';

async function main() {
  const canvas = document.createElement('canvas');
  const app = document.getElementById('app');
  if (app) {
    app.prepend(canvas);
  } else {
    document.body.prepend(canvas);
  }
  
  canvas.style.position = 'absolute';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    document.body.innerHTML = '<div style="color:white;background:#000;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;font-family:monospace;text-align:center;"><div><h1>MARS: 2187</h1><p>WebGL is required to run this game.</p><p>Please use Chrome, Firefox, or Edge with hardware acceleration enabled.</p></div></div>';
    return;
  }
  
  try {
    const game = Game.getInstance();
    await game.init();
    
    // Quick hook for UI overlay
    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.innerHTML = `
        <div style="position:absolute; top:20px; left:20px; color:#00ccff; font-family:monospace; font-size:18px;">
          MARS: 2187<br>
          <span style="font-size:12px; color:#fff;">W/A/S/D to move. Mouse to look. Esc to pause.</span>
        </div>
      `;
    }
  } catch (err) {
    console.error('Game initialization failed:', err);
  }
}

main();
