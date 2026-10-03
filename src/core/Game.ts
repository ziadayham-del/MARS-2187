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
    
    this.gamePhase = GamePhase.PLAYING;
    
    // Auto-start pointer lock when clicking the canvas
    this.renderer.renderer.domElement.addEventListener('click', () => {
      if (this.gamePhase === GamePhase.PLAYING) {
        this.inputManager.requestPointerLock();
      }
    });

    this.gameLoop.start(
      (delta, time) => this.update(delta, time),
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
        forward: this.inputManager.isKeyDown('w'),
        back: this.inputManager.isKeyDown('s'),
        left: this.inputManager.isKeyDown('a'),
        right: this.inputManager.isKeyDown('d'),
        sprint: this.inputManager.isKeyDown('shift'),
        jump: this.inputManager.isKeyDown(' '),
        mouseDeltaX: this.inputManager.getMouseDelta().x,
        mouseDeltaY: this.inputManager.getMouseDelta().y
      };
      
      this.playerController.update(delta, input, this.world.terrain);
      this.playerState.update(delta, { isInsideHabitat: false, isNearOxygenSource: false, powerOnline: false, stormActive: false });
      this.interactionSystem.update(this.scene);
      
      if (this.inputManager.isKeyPressed('e')) {
        this.interactionSystem.tryInteract();
      }
      if (this.inputManager.isKeyPressed('f')) {
        this.playerState.flashlightOn = !this.playerState.flashlightOn;
        this.lighting.setFlashlightEnabled(this.playerState.flashlightOn);
      }
      if (this.inputManager.isKeyPressed('escape')) {
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
