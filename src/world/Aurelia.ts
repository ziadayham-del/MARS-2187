// ============================================================
//  MARS: 2187  –  Aurelia.ts
//  Builds the Aurelia colony — the main explorable area.
//  All geometry uses WorldObjects helpers; no placeholders.
// ============================================================

import * as THREE from 'three';
import {
  PALETTE,
  buildHabitatDome,
  buildSolarArray,
  buildCommTower,
  buildLandingPad,
  buildCargoContainer,
  buildPipe,
  buildAirlock,
  buildTerminal,
  buildWorkbench,
  buildSleepingPod,
  buildMedBed,
  buildHydroponicsRack,
  buildReactorCore,
  buildEnergyNode,
  buildCeilingFan,
  buildAntennaDish,
  buildEmergencyLight,
  buildFloor,
  buildCeiling,
  buildWall,
  makeRoomLight,
  makeBox,
  makeCylinder,
  makeSphere,
  makeTorus,
} from './WorldObjects.js';

// ---- Public interfaces -------------------------------------------------------

export interface InteractableObject {
  id:       string;
  mesh:     THREE.Object3D;
  name:     string;
  prompt:   string;
  action:   string;
  position: THREE.Vector3;
}

export interface DoorObject {
  id:     string;
  group:  THREE.Group;
  isOpen: boolean;
  toggle(): void;
}

export interface TerminalObject {
  id:         string;
  mesh:       THREE.Object3D;
  terminalId: string;
  position:   THREE.Vector3;
}

// ---- AureliaColony -----------------------------------------------------------

export class AureliaColony {
  public group:            THREE.Group      = new THREE.Group();
  public interactables:    InteractableObject[] = [];
  public doors:            DoorObject[]         = [];
  public fans:             THREE.Group[]        = [];
  public lights:           THREE.Light[]        = [];
  public reactorNodes:     THREE.Group[]        = [];
  public pressureModules:  THREE.Group[]        = [];
  public terminals:        TerminalObject[]     = [];

  /** Accumulated time for oscillating animations. */
  private _time: number = 0;

  /** All emissive meshes that should be disabled when reactor is offline. */
  private _normalLightMeshes: THREE.Mesh[]  = [];
  private _emergencyMeshes:   THREE.Mesh[]  = [];
  private _screenMeshes:      THREE.Mesh[]  = [];

  /** Point lights split by system. */
  private _normalLights:    THREE.PointLight[] = [];
  private _emergencyLights: THREE.PointLight[] = [];
  private _commsLights:     THREE.PointLight[] = [];

  /** Colony power state. */
  private _reactorOnline: boolean = false;
  private _oxygenOnline:  boolean = false;
  private _commsOnline:   boolean = false;

  constructor() {
    this.group.name = 'AureliaColony';
  }

  // ── Public builders ──────────────────────────────────────────────────────

  public buildExterior(scene: THREE.Scene): void {
    const ext = new THREE.Group();
    ext.name = 'exterior';

    // Ground plane
    const ground = buildFloor(320, 320, PALETTE.groundDark);
    ground.position.y = -0.01;
    ext.add(ground);

    // ── Habitat domes ─────────────────────────────────────────────────────
    const domeConfigs: Array<{ pos: [number, number, number]; r: number }> = [
      { pos: [  0,  0,   0], r: 16 }, // Main dome
      { pos: [ 38,  0,  10], r: 10 }, // Secondary dome A
      { pos: [-35,  0,  12], r: 10 }, // Secondary dome B
      { pos: [  8,  0,  44], r:  7 }, // Small dome
    ];
    for (const { pos, r } of domeConfigs) {
      const dome = buildHabitatDome(r, PALETTE.domeHull);
      dome.position.set(...pos);
      ext.add(dome);
    }

    // ── Solar arrays ──────────────────────────────────────────────────────
    const solarA = buildSolarArray(8, 3.8);
    solarA.position.set(-60, 0, -20);
    solarA.rotation.y = Math.PI / 8;
    ext.add(solarA);

    const solarB = buildSolarArray(6, 3.8);
    solarB.position.set(55, 0, -25);
    solarB.rotation.y = -Math.PI / 10;
    ext.add(solarB);

    // ── Communications tower ──────────────────────────────────────────────
    const tower = buildCommTower(30);
    tower.position.set(-50, 0, 30);
    ext.add(tower);

    // ── Landing pads ──────────────────────────────────────────────────────
    const padA = buildLandingPad(14);
    padA.position.set(70, 0, 20);
    ext.add(padA);

    const padB = buildLandingPad(10);
    padB.position.set(72, 0, -30);
    ext.add(padB);

    // ── Cargo containers ─────────────────────────────────────────────────
    const containerPositions: Array<[number, number, number, number]> = [
      [ 28, 0,  55, 0],
      [ 36, 0,  55, 0.3],
      [ 44, 0,  55, -0.2],
      [-30, 0,  50, 0.8],
      [-38, 0,  50, 0],
    ];
    for (const [cx, cy, cz, ry] of containerPositions) {
      const c = buildCargoContainer(6, 3, 2.5);
      c.position.set(cx, cy, cz);
      c.rotation.y = ry;
      ext.add(c);
    }

    // ── Pipe runs ─────────────────────────────────────────────────────────
    const pipeRuns: Array<{ len: number; pos: [number, number, number]; ry: number }> = [
      { len: 30, pos: [ 20, 1.4, 10], ry: 0 },
      { len: 25, pos: [-18, 1.4, 10], ry: Math.PI / 4 },
      { len: 18, pos: [  0, 1.4, 30], ry: Math.PI / 2 },
    ];
    for (const { len, pos, ry } of pipeRuns) {
      const pipe = buildPipe(len, 0.22, PALETTE.pipe);
      pipe.position.set(...pos);
      pipe.rotation.y = ry;
      ext.add(pipe);
    }

    // Elevated walkway pipes
    const walkway = buildPipe(40, 0.4, PALETTE.metalDark);
    walkway.position.set(0, 3.5, 0);
    ext.add(walkway);

    // ── Airlock entrances ─────────────────────────────────────────────────
    const airlockPositions: Array<[number, number, number, number]> = [
      [  0,  0, -16.5, 0],
      [ 16,  0,   3,   -Math.PI / 2],
      [-16,  0,   3,    Math.PI / 2],
    ];
    for (const [ax, ay, az, ary] of airlockPositions) {
      const al = buildAirlock(3, 4, 1.0);
      al.position.set(ax, ay, az);
      al.rotation.y = ary;
      ext.add(al);

      const doorObj = this._makeDoorObject(`ext_airlock_${ax}_${az}`, al);
      this.doors.push(doorObj);
    }

    // ── Pressure modules / junction boxes ────────────────────────────────
    for (let i = 0; i < 5; i++) {
      const mod = new THREE.Group();
      const body = makeBox(2.5, 2.0, 1.8, PALETTE.metalMid, { roughness: 0.7, metalness: 0.4 });
      body.position.y = 1.0;
      mod.add(body);
      const vent = makeCylinder(0.25, 0.25, 0.5, 8, PALETTE.metalDark, { metalness: 0.6 });
      vent.position.set(0.5, 2.1, 0);
      vent.rotation.x = Math.PI / 2;
      mod.add(vent);
      mod.position.set(-8 + i * 4, 0, -12);
      this.pressureModules.push(mod);
      ext.add(mod);
    }

    // ── Antenna dish near comm tower ──────────────────────────────────────
    const dish = buildAntennaDish(5);
    dish.position.set(-46, 12, 30);
    dish.rotation.x = Math.PI / 6;
    ext.add(dish);

    // ── Ambient exterior light ────────────────────────────────────────────
    const sunDir = new THREE.DirectionalLight(0xffddaa, 0.9);
    sunDir.position.set(80, 120, -40);
    sunDir.castShadow             = true;
    sunDir.shadow.mapSize.set(2048, 2048);
    sunDir.shadow.camera.left    = -180;
    sunDir.shadow.camera.right   =  180;
    sunDir.shadow.camera.top     =  180;
    sunDir.shadow.camera.bottom  = -180;
    sunDir.shadow.camera.near    =   1;
    sunDir.shadow.camera.far     = 400;
    ext.add(sunDir);

    const ambient = new THREE.AmbientLight(0x221a15, 0.4);
    ext.add(ambient);

    this.group.add(ext);
    scene.add(this.group);
  }

  public buildInterior(scene: THREE.Scene): void {
    const int = new THREE.Group();
    int.name = 'interior';

    // Each room is placed at a world offset inside the main dome / corridors.
    int.add(this.buildReactorRoom  (scene, new THREE.Vector3(  0, 0,   0)));
    int.add(this.buildEngineering  (scene, new THREE.Vector3( 35, 0,   0)));
    int.add(this.buildHabitation   (scene, new THREE.Vector3(-35, 0,   0)));
    int.add(this.buildMedBay       (scene, new THREE.Vector3(  0, 0,  35)));
    int.add(this.buildControlCenter(scene, new THREE.Vector3(  0, 0, -35)));
    int.add(this.buildHydroponics  (scene, new THREE.Vector3( 35, 0,  35)));
    int.add(this.buildCommRoom     (scene, new THREE.Vector3(-35, 0,  35)));

    this.group.add(int);
  }

  // ── Room builders ────────────────────────────────────────────────────────

  public buildReactorRoom(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'reactorRoom';

    const W = 30, H = 16, D = 30;

    // Shell
    room.add(this._addFloor   (W, D, PALETTE.concrete));
    room.add(this._addCeiling (W, D, H, PALETTE.panelGrey));
    this._addWalls(room, W, H, D);

    // Central reactor
    const reactor = buildReactorCore(this._reactorOnline);
    reactor.position.set(0, 0, 0);
    reactor.name = 'reactor';
    room.add(reactor);

    // Collect inner emissive meshes
    reactor.traverse(c => {
      if (c instanceof THREE.Mesh && (c.material as THREE.MeshStandardMaterial).emissive) {
        const em = (c.material as THREE.MeshStandardMaterial).emissiveIntensity;
        if (em > 0) this._normalLightMeshes.push(c);
      }
    });

    // Energy nodes on 3 walls
    const nodePositions: Array<[number, number, number, number]> = [
      [-12, 4, -14, 0],
      [ 12, 4, -14, 0],
      [  0, 4,  14, Math.PI],
    ];
    for (const [nx, ny, nz, nry] of nodePositions) {
      const node = buildEnergyNode(false);
      node.position.set(nx, ny, nz);
      node.rotation.y = nry;
      node.name = `energyNode_${nx}`;
      this.reactorNodes.push(node);
      room.add(node);

      // Interactable
      this.interactables.push({
        id:       `reactor_node_${nx}`,
        mesh:     node,
        name:     'Energy Node',
        prompt:   'Activate Node',
        action:   'ACTIVATE_ENERGY_NODE',
        position: new THREE.Vector3(nx, ny, nz).add(position),
      });
    }

    // Emergency lights
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const eLight = buildEmergencyLight();
      eLight.position.set(Math.sin(angle) * 10, H - 0.5, Math.cos(angle) * 10);
      this._emergencyMeshes.push(eLight);
      room.add(eLight);

      const pt = makeRoomLight(PALETTE.emergency, 2.0, 12, eLight.position.clone().add(position));
      this._emergencyLights.push(pt);
      room.add(pt);
    }

    // Normal ceiling lights
    const reactorRoomLight = makeRoomLight(0x88ccff, 3.0, 30, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(reactorRoomLight);
    this.lights.push(reactorRoomLight);
    room.add(reactorRoomLight);

    // Fan
    const fan = buildCeilingFan(3.0);
    fan.position.set(0, H - 0.3, 0);
    this.fans.push(fan);
    room.add(fan);

    // Catwalk railing
    const catwalk = makeBox(W - 2, 0.1, 2.0, PALETTE.metalMid, { metalness: 0.5 });
    catwalk.position.set(0, 7, -12);
    room.add(catwalk);

    room.position.copy(position);
    return room;
  }

  public buildEngineering(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'engineering';

    const W = 22, H = 7, D = 22;

    room.add(this._addFloor  (W, D, PALETTE.metalDark));
    room.add(this._addCeiling(W, D, H, PALETTE.panelGrey));
    this._addWalls(room, W, H, D);

    // Workbenches
    const wbPositions: Array<[number, number]> = [[-7, -8], [0, -8], [7, -8]];
    for (const [wx, wz] of wbPositions) {
      const wb = buildWorkbench(3.0);
      wb.position.set(wx, 0, wz);
      room.add(wb);
    }

    // Terminals
    const termPositions: Array<[number, number, number, number]> = [
      [-9, 0, -9, Math.PI / 4],
      [ 9, 0, -9, -Math.PI / 4],
      [ 9, 0,  9, -3 * Math.PI / 4],
    ];
    for (let i = 0; i < termPositions.length; i++) {
      const [tx, ty, tz, try_] = termPositions[i];
      const term = buildTerminal();
      term.position.set(tx, ty, tz);
      term.rotation.y = try_;
      room.add(term);

      this._collectScreenMeshes(term);

      const termObj: TerminalObject = {
        id:         `eng_terminal_${i}`,
        mesh:       term,
        terminalId: `engineering_terminal_${i}`,
        position:   new THREE.Vector3(tx, ty, tz).add(position),
      };
      this.terminals.push(termObj);

      this.interactables.push({
        id:       `eng_terminal_${i}`,
        mesh:     term,
        name:     'Engineering Terminal',
        prompt:   'Use Terminal',
        action:   'OPEN_TERMINAL',
        position: termObj.position,
      });
    }

    // Pipe runs across ceiling
    const cpipe = buildPipe(W - 4, 0.18, PALETTE.pipe);
    cpipe.position.set(0, H - 1.0, -6);
    room.add(cpipe);

    // Large toolbox prop
    const toolbox = makeBox(1.0, 0.7, 0.6, PALETTE.rustBright, { roughness: 0.7, metalness: 0.3 });
    toolbox.position.set(-4, 0.35, 5);
    room.add(toolbox);

    // Power junction box
    const junction = makeBox(1.5, 2.0, 0.5, PALETTE.metalMid, { roughness: 0.6, metalness: 0.5 });
    junction.position.set(-9.5, 1.0, 0);
    room.add(junction);

    // Fans
    for (const fz of [-6, 6]) {
      const fan = buildCeilingFan(2.2);
      fan.position.set(0, H - 0.3, fz);
      this.fans.push(fan);
      room.add(fan);
    }

    // Lighting
    const lt = makeRoomLight(0xaaddff, 2.5, 22, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, -9);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 1.5, 12, new THREE.Vector3(0, H - 1, -9).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  public buildHabitation(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'habitation';

    const W = 22, H = 6, D = 28;

    room.add(this._addFloor  (W, D, 0x2a2520));
    room.add(this._addCeiling(W, D, H, PALETTE.panelGrey));
    this._addWalls(room, W, H, D);

    // Sleeping pods — two rows
    const podRows: Array<[number, number, number, number]> = [
      [-7.5, 0, -10, 0],
      [-7.5, 0,  -4, 0],
      [-7.5, 0,   2, 0],
      [-7.5, 0,   8, 0],
      [ 7.5, 0, -10, Math.PI],
      [ 7.5, 0,  -4, Math.PI],
      [ 7.5, 0,   2, Math.PI],
      [ 7.5, 0,   8, Math.PI],
    ];
    for (const [px, py, pz, pry] of podRows) {
      const pod = buildSleepingPod();
      pod.position.set(px, py, pz);
      pod.rotation.y = pry;
      room.add(pod);
    }

    // Personal-item boxes (half-finished meals)
    const mealPositions: Array<[number, number, number]> = [
      [-7.0, 0.82, -10],
      [ 7.0, 0.82,  -4],
      [-7.0, 0.82,   2],
    ];
    for (const [mx, my, mz] of mealPositions) {
      const meal = makeBox(0.22, 0.18, 0.22, 0x8a6040, { roughness: 0.9 });
      meal.position.set(mx, my, mz);
      room.add(meal);
    }

    // Small personal locker units
    for (let i = 0; i < 4; i++) {
      const locker = makeBox(0.7, 2.0, 0.5, PALETTE.panelLight, { roughness: 0.65, metalness: 0.4 });
      locker.position.set(-9.5, 1.0, -10 + i * 4);
      room.add(locker);
    }

    // Common table
    const table = buildWorkbench(4.0);
    table.position.set(0, 0, 12);
    room.add(table);

    // Chair stools
    for (const cx of [-1.5, 0, 1.5]) {
      const stool = makeCylinder(0.2, 0.2, 0.6, 8, PALETTE.metalMid, { metalness: 0.4 });
      stool.position.set(cx, 0.3, 11);
      room.add(stool);
    }

    // Lighting — warm to feel lived-in
    const lt = makeRoomLight(0xffddaa, 2.0, 26, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, 0);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 1.5, 12, new THREE.Vector3(0, H - 1, 0).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  public buildMedBay(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'medBay';

    const W = 20, H = 6, D = 24;

    room.add(this._addFloor  (W, D, 0x1e2830));
    room.add(this._addCeiling(W, D, H, 0xcccccc));
    this._addWalls(room, W, H, D);

    // Medical beds
    const bedPositions: Array<[number, number, number, number]> = [
      [-7, 0, -8, 0],
      [-7, 0,  0, 0],
      [-7, 0,  8, 0],
      [ 7, 0, -8, Math.PI],
      [ 7, 0,  8, Math.PI],
    ];
    for (const [bx, by, bz, bry] of bedPositions) {
      const bed = buildMedBed();
      bed.position.set(bx, by, bz);
      bed.rotation.y = bry;
      room.add(bed);
    }

    // Equipment storage cabinet
    const cabinet = makeBox(3.0, 2.2, 0.6, PALETTE.medBlue, { roughness: 0.5, metalness: 0.4 });
    cabinet.position.set(0, 1.1, -11);
    room.add(cabinet);

    // Medical terminal
    const medTerm = buildTerminal(1.0, 1.4, 0.45);
    medTerm.position.set(8, 0, -10);
    medTerm.rotation.y = Math.PI;
    room.add(medTerm);
    this._collectScreenMeshes(medTerm);
    const termObj: TerminalObject = {
      id:         'med_terminal_0',
      mesh:       medTerm,
      terminalId: 'medbay_terminal',
      position:   new THREE.Vector3(8, 0, -10).add(position),
    };
    this.terminals.push(termObj);
    this.interactables.push({
      id: 'med_terminal_0', mesh: medTerm, name: 'Medical Terminal',
      prompt: 'Access Records', action: 'OPEN_TERMINAL', position: termObj.position,
    });

    // IV drip stand
    const stand = makeCylinder(0.04, 0.04, 1.6, 6, PALETTE.metalLight, { metalness: 0.7 });
    stand.position.set(-5.5, 0.8, -8);
    room.add(stand);
    const ivBag = makeBox(0.18, 0.3, 0.08, 0xddffdd, { roughness: 0.3, transparent: true, opacity: 0.7 } as any);
    ivBag.position.set(-5.5, 1.75, -8);
    room.add(ivBag);

    // Bright medical lighting
    const lt = makeRoomLight(0xddeeff, 3.0, 24, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, -10);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 1.5, 12, new THREE.Vector3(0, H - 1, -10).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  public buildControlCenter(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'controlCenter';

    const W = 28, H = 8, D = 28;

    room.add(this._addFloor  (W, D, PALETTE.metalDark));
    room.add(this._addCeiling(W, D, H, PALETTE.panelGrey));
    this._addWalls(room, W, H, D);

    // Central command console — large hexagonal shape approximated by cylinders + boxes
    const cmdBase = makeCylinder(4.0, 4.0, 0.9, 6, PALETTE.metalMid, { metalness: 0.6 });
    cmdBase.position.set(0, 0.45, 0);
    room.add(cmdBase);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const panel = makeBox(1.8, 1.0, 0.35, PALETTE.panelLight, { roughness: 0.5, metalness: 0.5 });
      panel.position.set(Math.sin(angle) * 3.2, 1.35, Math.cos(angle) * 3.2);
      panel.rotation.y = -angle;
      room.add(panel);

      const screenF = makeBox(1.4, 0.7, 0.04, PALETTE.screenGlow, {
        roughness: 0.1, metalness: 0.0, emissive: PALETTE.screenGlow, emissiveIntensity: 1.3,
      });
      screenF.position.set(Math.sin(angle) * 3.4, 1.55, Math.cos(angle) * 3.4);
      screenF.rotation.y = -angle;
      screenF.name = 'cmdScreen';
      this._screenMeshes.push(screenF);
      this._normalLightMeshes.push(screenF);
      room.add(screenF);
    }

    // Wall terminals — ring around room
    const wallTermPositions: Array<[number, number, number, number]> = [
      [-12, 0, -12, Math.PI / 4],
      [  0, 0, -13, 0],
      [ 12, 0, -12, -Math.PI / 4],
      [ 13, 0,   0, -Math.PI / 2],
      [-13, 0,   0,  Math.PI / 2],
    ];
    for (let i = 0; i < wallTermPositions.length; i++) {
      const [tx, ty, tz, try_] = wallTermPositions[i];
      const term = buildTerminal(1.4, 1.8, 0.5);
      term.position.set(tx, ty, tz);
      term.rotation.y = try_;
      room.add(term);
      this._collectScreenMeshes(term);

      const termObj: TerminalObject = {
        id:         `ctrl_terminal_${i}`,
        mesh:       term,
        terminalId: `control_terminal_${i}`,
        position:   new THREE.Vector3(tx, ty, tz).add(position),
      };
      this.terminals.push(termObj);
      this.interactables.push({
        id: `ctrl_terminal_${i}`, mesh: term, name: 'Control Terminal',
        prompt: 'Access System', action: 'OPEN_TERMINAL', position: termObj.position,
      });
    }

    // Large display screens on north wall
    for (let i = 0; i < 3; i++) {
      const bigScreen = makeBox(6.5, 4.0, 0.12, PALETTE.screenGlow, {
        roughness: 0.05, metalness: 0.0,
        emissive: PALETTE.screenGlow, emissiveIntensity: 0.85,
      });
      bigScreen.position.set(-8 + i * 8, 5.0, -13.5);
      bigScreen.name = `bigScreen_${i}`;
      this._screenMeshes.push(bigScreen);
      this._normalLightMeshes.push(bigScreen);
      room.add(bigScreen);
    }

    // Fan
    const fan = buildCeilingFan(3.5);
    fan.position.set(0, H - 0.3, 0);
    this.fans.push(fan);
    room.add(fan);

    // Lighting
    const lt = makeRoomLight(0x88aaff, 3.5, 30, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, 0);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 2.0, 16, new THREE.Vector3(0, H - 1, 0).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  public buildHydroponics(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'hydroponics';

    const W = 24, H = 7, D = 24;

    room.add(this._addFloor  (W, D, 0x1a2a1a));
    room.add(this._addCeiling(W, D, H, 0x2a3a2a));
    this._addWalls(room, W, H, D);

    // Grow racks — 3 rows
    const rackPositions: Array<[number, number, number, number]> = [
      [-8, 0, -8, 0],
      [ 0, 0, -8, 0],
      [ 8, 0, -8, 0],
      [-8, 0,  2, 0],
      [ 0, 0,  2, 0],
      [ 8, 0,  2, 0],
    ];
    for (const [rx, ry, rz, rrot] of rackPositions) {
      const rack = buildHydroponicsRack(3);
      rack.position.set(rx, ry, rz);
      rack.rotation.y = rrot;
      room.add(rack);
    }

    // Water tanks
    for (let i = 0; i < 3; i++) {
      const tank = makeCylinder(0.6, 0.6, 3.0, 12, PALETTE.metalMid, {
        roughness: 0.4, metalness: 0.5,
      });
      tank.position.set(-9.5 + i * 4, 1.5, 10);
      room.add(tank);

      const liquid = makeCylinder(0.48, 0.48, 2.6, 10, 0x1a5a3a, {
        roughness: 0.2, metalness: 0.0,
        emissive: 0x1a5a3a, emissiveIntensity: 0.3,
      });
      (liquid.material as THREE.MeshStandardMaterial).transparent = true;
      (liquid.material as THREE.MeshStandardMaterial).opacity     = 0.7;
      liquid.position.set(-9.5 + i * 4, 1.5, 10);
      room.add(liquid);
    }

    // Nutrient terminal
    const hydTerm = buildTerminal();
    hydTerm.position.set(10, 0, 10);
    hydTerm.rotation.y = -Math.PI / 2;
    room.add(hydTerm);
    this._collectScreenMeshes(hydTerm);
    const termObj: TerminalObject = {
      id:         'hyd_terminal_0',
      mesh:       hydTerm,
      terminalId: 'hydroponics_terminal',
      position:   new THREE.Vector3(10, 0, 10).add(position),
    };
    this.terminals.push(termObj);
    this.interactables.push({
      id: 'hyd_terminal_0', mesh: hydTerm, name: 'Nutrient Terminal',
      prompt: 'Monitor Growth', action: 'OPEN_TERMINAL', position: termObj.position,
    });

    // Grow lights (extra strips on ceiling)
    for (let i = 0; i < 4; i++) {
      const strip = makeBox(W - 4, 0.1, 0.18, 0x88ff88, {
        roughness: 0.1, emissive: 0x88ff88, emissiveIntensity: 0.8,
      });
      strip.position.set(0, H - 0.1, -9 + i * 4.5);
      this._normalLightMeshes.push(strip);
      room.add(strip);
    }

    // Lighting — cool green
    const lt = makeRoomLight(0x44ff88, 2.5, 28, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, -10);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 1.5, 12, new THREE.Vector3(0, H - 1, -10).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  public buildCommRoom(scene: THREE.Scene, position: THREE.Vector3): THREE.Group {
    const room = new THREE.Group();
    room.name  = 'commRoom';

    const W = 20, H = 7, D = 20;

    room.add(this._addFloor  (W, D, PALETTE.metalDark));
    room.add(this._addCeiling(W, D, H, PALETTE.panelGrey));
    this._addWalls(room, W, H, D);

    // Antenna/signal equipment: upright antenna posts
    for (let i = 0; i < 3; i++) {
      const antPost = makeCylinder(0.12, 0.12, 5.0, 8, PALETTE.metalLight, { metalness: 0.7 });
      antPost.position.set(-6 + i * 6, 2.5, -8);
      room.add(antPost);

      const dish = buildAntennaDish(1.2);
      dish.position.set(-6 + i * 6, 5.5, -8);
      dish.rotation.x = -Math.PI / 4;
      room.add(dish);
    }

    // Signal display screens on wall
    for (let i = 0; i < 4; i++) {
      const display = makeBox(3.0, 2.0, 0.1, PALETTE.screenGlow, {
        roughness: 0.05, metalness: 0.0,
        emissive: PALETTE.emissiveCyan, emissiveIntensity: 0.9,
      });
      display.position.set(-7.5 + i * 5, 4.5, -9.4);
      display.name = `commDisplay_${i}`;
      this._screenMeshes.push(display);
      this._normalLightMeshes.push(display);
      this._commsLights.push(makeRoomLight(PALETTE.emissiveCyan, 1.5, 10,
        new THREE.Vector3(-7.5 + i * 5, 4.5, -9.4).add(position)));
      room.add(display);
    }

    // Main comms terminal
    const commsTerm = buildTerminal(1.6, 2.0, 0.6);
    commsTerm.position.set(0, 0, 0);
    room.add(commsTerm);
    this._collectScreenMeshes(commsTerm);
    const termObj: TerminalObject = {
      id:         'comms_terminal_0',
      mesh:       commsTerm,
      terminalId: 'comms_terminal',
      position:   new THREE.Vector3(0, 0, 0).add(position),
    };
    this.terminals.push(termObj);
    this.interactables.push({
      id: 'comms_terminal_0', mesh: commsTerm, name: 'Communications Terminal',
      prompt: 'Boost Signal', action: 'OPEN_TERMINAL', position: termObj.position,
    });

    // Signal booster box
    const booster = makeBox(2.0, 1.5, 1.0, PALETTE.panelGrey, { roughness: 0.6, metalness: 0.4 });
    booster.position.set(7, 0.75, 5);
    room.add(booster);
    const boosterLight = makeSphere(0.18, 8, PALETTE.emissiveCyan, {
      emissive: PALETTE.emissiveCyan, emissiveIntensity: 3.0,
    });
    boosterLight.position.set(7, 1.58, 4.45);
    boosterLight.name = 'boosterStatus';
    this._screenMeshes.push(boosterLight);
    room.add(boosterLight);

    // Lighting
    const lt = makeRoomLight(0x4488cc, 2.5, 22, new THREE.Vector3(0, H - 1, 0).add(position));
    this._normalLights.push(lt);
    this.lights.push(lt);
    room.add(lt);

    const elt = buildEmergencyLight();
    elt.position.set(0, H - 0.5, 8);
    this._emergencyMeshes.push(elt);
    room.add(elt);
    const ept = makeRoomLight(PALETTE.emergency, 1.5, 12, new THREE.Vector3(0, H - 1, 8).add(position));
    this._emergencyLights.push(ept);
    room.add(ept);

    room.position.copy(position);
    return room;
  }

  // ── State setters ────────────────────────────────────────────────────────

  public setReactorOnline(online: boolean): void {
    this._reactorOnline = online;

    // Normal lights
    for (const lt of this._normalLights) {
      lt.visible  = online;
      lt.intensity = online ? 3.0 : 0.0;
    }
    // Normal emissive surfaces
    for (const mesh of this._normalLightMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = online ? (mesh.userData['baseEmissiveIntensity'] as number ?? 1.0) : 0.0;
    }
    // Screen meshes
    for (const mesh of this._screenMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = online ? 1.0 : 0.0;
    }
    // Emergency lights (only when offline)
    for (const lt of this._emergencyLights) {
      lt.visible  = !online;
      lt.intensity = online ? 0.0 : 1.5;
    }
    for (const mesh of this._emergencyMeshes) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = online ? 0.0 : 3.0;
    }
  }

  public setOxygenOnline(online: boolean): void {
    this._oxygenOnline = online;
    // When oxygen offline, fans stop (handled in update())
  }

  public setCommsOnline(online: boolean): void {
    this._commsOnline = online;
    for (const lt of this._commsLights) {
      lt.visible  = online;
      lt.intensity = online ? 1.5 : 0.0;
    }
    // Toggle comms screen emissive
    for (const mesh of this._screenMeshes) {
      if (mesh.name.startsWith('commDisplay') || mesh.name === 'boosterStatus') {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = online ? 1.0 : 0.0;
      }
    }
  }

  // ── Update loop ──────────────────────────────────────────────────────────

  public update(delta: number): void {
    this._time += delta;

    // Animate fans — only spin when oxygen system is online
    if (this._oxygenOnline && this._reactorOnline) {
      for (const fan of this.fans) {
        fan.rotation.y += delta * 4.0;
      }
    }

    // Pulse reactor node crystals
    for (const node of this.reactorNodes) {
      const active = node.userData['active'] as boolean;
      node.traverse(child => {
        if (child.name === 'crystal' && child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (active) {
            mat.emissiveIntensity = 1.5 + Math.sin(this._time * 3.0) * 0.5;
          }
        }
      });
    }

    // Emergency light pulse (slow blink when reactor offline)
    if (!this._reactorOnline) {
      const blink = 0.5 + 0.5 * Math.sin(this._time * 2.5);
      for (const lt of this._emergencyLights) {
        lt.intensity = blink * 2.0;
      }
      for (const mesh of this._emergencyMeshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = blink * 3.5;
      }
    }

    // Comm tower blink
    this.group.traverse(child => {
      if (child.userData['blinkLight'] && child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = Math.sin(this._time * 2.0) > 0 ? 3.0 : 0.0;
      }
    });
  }

  // ── Disposal ─────────────────────────────────────────────────────────────

  public dispose(): void {
    this.group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    this.fans            = [];
    this.lights          = [];
    this.reactorNodes    = [];
    this.pressureModules = [];
    this.interactables   = [];
    this.doors           = [];
    this.terminals       = [];
    this._normalLightMeshes  = [];
    this._emergencyMeshes    = [];
    this._screenMeshes       = [];
    this._normalLights       = [];
    this._emergencyLights    = [];
    this._commsLights        = [];
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private _addFloor(w: number, d: number, color: number): THREE.Mesh {
    return buildFloor(w, d, color);
  }

  private _addCeiling(w: number, d: number, h: number, color: number): THREE.Mesh {
    const ceil = buildCeiling(w, d, color);
    ceil.position.y = h;
    return ceil;
  }

  private _addWalls(room: THREE.Group, w: number, h: number, d: number): void {
    const halfH = h / 2;
    const wallColor = PALETTE.metalDark;

    // North
    const north = buildWall(w, h, wallColor);
    north.position.set(0, halfH, -d / 2);
    room.add(north);

    // South
    const south = buildWall(w, h, wallColor);
    south.position.set(0, halfH, d / 2);
    south.rotation.y = Math.PI;
    room.add(south);

    // East
    const east = buildWall(d, h, wallColor);
    east.position.set(w / 2, halfH, 0);
    east.rotation.y = -Math.PI / 2;
    room.add(east);

    // West
    const west = buildWall(d, h, wallColor);
    west.position.set(-w / 2, halfH, 0);
    west.rotation.y = Math.PI / 2;
    room.add(west);
  }

  private _makeDoorObject(id: string, group: THREE.Group): DoorObject {
    let isOpen = false;
    const leftPanel  = group.getObjectByName('doorLeft');
    const rightPanel = group.getObjectByName('doorRight');

    return {
      id,
      group,
      isOpen,
      toggle(): void {
        isOpen = !isOpen;
        this.isOpen = isOpen;
        if (leftPanel && rightPanel) {
          const openOffset = isOpen ? 1.5 : 0;
          leftPanel.position.x  = -(group.userData['halfW'] as number ?? 0.75) - openOffset;
          rightPanel.position.x =  (group.userData['halfW'] as number ?? 0.75) + openOffset;
        }
      },
    };
  }

  private _collectScreenMeshes(termGroup: THREE.Group): void {
    termGroup.traverse(child => {
      if (child.name === 'screen' && child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        child.userData['baseEmissiveIntensity'] = mat.emissiveIntensity;
        this._screenMeshes.push(child);
        this._normalLightMeshes.push(child);
      }
    });
  }
}
