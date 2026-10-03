import * as THREE from 'three';
import { GameLoop } from './GameLoop.js';
import { InputManager } from './InputManager.js';
import { EventBus } from './EventBus.js';
import { Renderer } from '../rendering/Renderer.js';
import { Lighting } from '../rendering/Lighting.js';
import { Environment } from '../rendering/Environment.js';
import { PostProcessing } from '../rendering/PostProcessing.js';
import { PlayerController } from '../player/PlayerController.js';
import { PlayerState } from '../player/PlayerState.js';
import { InteractionSystem } from '../player/InteractionSystem.js';
import { World } from '../world/World.js';
import { HUD } from '../ui/HUD.js';
import { SuitSystem } from '../player/SuitSystem.js';

export enum GamePhase {
  LOADING, MAIN_MENU, CINEMATIC, PLAYING, ROVER, PAUSED, TERMINAL, DIALOGUE, CHOICE, ENDING, CREDITS
}

export class Game {
  private static instance: Game;
  
  renderer!: Renderer;
  scene!: THREE.Scene;
  camera!: THREE.PerspectiveCamera;
  gameLoop!: GameLoop;
  inputManager!: InputManager;
  world!: World;
  playerController!: PlayerController;
  playerState!: PlayerState;
  interactionSystem!: InteractionSystem;
  lighting!: Lighting;
  environment!: Environment;
  postProcessing!: PostProcessing;
  hud!: HUD;
  suitSystem!: SuitSystem;
  
  gamePhase: GamePhase = GamePhase.LOADING;
  devMode: boolean = false;
  
  private constructor() {}
  
  static getInstance(): Game {
    if (!Game.instance) {
      Game.instance = new Game();
    }
    return Game.instance;
  }
  
  async init(): Promise<void> {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    this.renderer = new Renderer(canvas);
    this.renderer.init();
    
    this.scene = this.renderer.scene;
    this.camera = this.renderer.camera;
    
    this.inputManager = new InputManager();
    this.gameLoop = new GameLoop();
    
    this.environment = new Environment();
    this.environment.init(this.scene);
    
    this.lighting = new Lighting();
    this.lighting.init(this.scene);
    
    this.postProcessing = new PostProcessing();
    this.postProcessing.init(this.renderer.renderer, this.scene, this.camera);
    
    this.world = new World(this.scene);
    this.world.init();
    
    this.playerController = new PlayerController(this.camera, this.scene);
    this.playerController.init();
    this.playerController.setPosition(new THREE.Vector3(0, 2, 0));
    
    this.playerState = new PlayerState();
    this.interactionSystem = new InteractionSystem(this.camera, this.scene);
    
    this.suitSystem = new SuitSystem(this.playerState);
    this.hud = new HUD();
    this.hud.show();
    
    this.gamePhase = GamePhase.CINEMATIC;
    
    // Auto-start pointer lock when clicking the canvas
    this.renderer.renderer.domElement.addEventListener('click', () => {
      if (this.gamePhase === GamePhase.PLAYING) {
        this.inputManager.requestPointerLock();
      }
    });

    // Landing Cinematic Sequence
    let dropHeight = 1000;
    this.playerController.setPosition(new THREE.Vector3(0, dropHeight, 0));
    
    const uiRoot = document.getElementById('ui-root');
    if (uiRoot) {
      uiRoot.innerHTML = '<div style="position:absolute; inset:0; background:black; color:white; display:flex; align-items:center; justify-content:center; font-family:monospace; font-size:24px; z-index:9999;" id="landing-overlay">INITIATING ATMOSPHERIC ENTRY...</div>';
    }

    let cinematicTime = 0;
    
    this.gameLoop.start(
      (delta, time) => {
        if (this.gamePhase === GamePhase.CINEMATIC) {
          cinematicTime += delta;
          
          if (cinematicTime < 5) {
            // Freefall
            dropHeight -= 200 * delta;
            this.playerController.setPosition(new THREE.Vector3(0, Math.max(2, dropHeight), 0));
            // Shake
            this.camera.position.x += (Math.random() - 0.5) * 0.5;
            this.camera.position.z += (Math.random() - 0.5) * 0.5;
            
            const overlay = document.getElementById('landing-overlay');
            if (overlay && cinematicTime > 2) overlay.innerText = 'WARNING: HIGH VELOCITY IMPACT IMMINENT';
          } else if (cinematicTime >= 5 && cinematicTime < 8) {
            this.playerController.setPosition(new THREE.Vector3(0, 2, 0)); // landed
            const overlay = document.getElementById('landing-overlay');
            if (overlay) {
              overlay.style.background = 'transparent';
              overlay.innerText = 'TOUCHDOWN SUCCESSFUL. SYSTEMS ONLINE.';
              overlay.style.textShadow = '0 0 10px #000';
            }
          } else if (cinematicTime >= 8) {
            this.gamePhase = GamePhase.PLAYING;
            const overlay = document.getElementById('landing-overlay');
            if (overlay) overlay.remove();
            
            if (uiRoot) {
              uiRoot.innerHTML = `
                <div style="position:absolute; top:20px; left:20px; color:#00ccff; font-family:monospace; font-size:18px; pointer-events:none; text-shadow: 0 0 4px #000; z-index:9999;">
                  MARS: 2187<br>
                  <span style="font-size:12px; color:#fff;">CLICK ANYWHERE TO START</span><br>
                  <span style="font-size:12px; color:#fff;">W/A/S/D to move. Mouse to look. Esc to pause.</span>
                </div>
              `;
            }
          }
        }
        
        this.update(delta, time);
      },
      () => this.render()
    );
  }
  
  startNewGame(): void {
    this.gamePhase = GamePhase.PLAYING;
    this.inputManager.requestPointerLock();
  }
  
  continueGame(): void {
    this.gamePhase = GamePhase.PLAYING;
    this.inputManager.requestPointerLock();
  }
  
  pauseGame(): void {
    this.gamePhase = GamePhase.PAUSED;
    this.gameLoop.pause();
    this.inputManager.exitPointerLock();
  }
  
  resumeGame(): void {
    this.gamePhase = GamePhase.PLAYING;
    this.gameLoop.resume();
    this.inputManager.requestPointerLock();
  }
  
  returnToMenu(): void {
    this.gamePhase = GamePhase.MAIN_MENU;
    this.gameLoop.resume();
    this.inputManager.exitPointerLock();
  }
  
  update(delta: number, time: number): void {
    if (this.gamePhase === GamePhase.PLAYING) {
      const input = {
        forward: this.inputManager.isMoveForward(),
        back: this.inputManager.isMoveBackward(),
        left: this.inputManager.isMoveLeft(),
        right: this.inputManager.isMoveRight(),
        sprint: this.inputManager.isSprint(),
        jump: this.inputManager.isJump(),
        mouseDeltaX: this.inputManager.getMouseDelta().x,
        mouseDeltaY: this.inputManager.getMouseDelta().y
      };
      
      this.playerController.update(delta, input, this.world.terrain);
      this.playerState.update(delta, { isInsideHabitat: false, isNearOxygenSource: false, powerOnline: false, stormActive: false });
      this.interactionSystem.update(this.scene);
      this.hud.update(this.suitSystem.getHUDData(), "EXPLORE MARS", { POWER: false, O2: false, COMMS: false });
      
      if (this.inputManager.isInteract()) {
        this.interactionSystem.tryInteract();
      }
      if (this.inputManager.isFlashlight()) {
        this.playerState.flashlightOn = !this.playerState.flashlightOn;
        this.lighting.setFlashlightEnabled(this.playerState.flashlightOn);
      }
      if (this.inputManager.isPause()) {
        this.pauseGame();
      }
    }
    
    this.world.update(delta, time);
    this.environment.update(delta, time);
    
    // Reset inputs
    if (this.gamePhase === GamePhase.PLAYING || this.gamePhase === GamePhase.ROVER) {
        this.inputManager.getMouseDelta(); // Clear delta
    }
  }
  
  render(): void {
    if (this.gamePhase !== GamePhase.LOADING) {
      this.postProcessing.render();
    }
  }
  
  dispose(): void {
    this.gameLoop.dispose();
    this.inputManager.dispose();
    this.world.dispose();
    this.renderer.dispose();
  }
}
