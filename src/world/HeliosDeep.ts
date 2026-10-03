// ============================================================
//  MARS: 2187  –  HeliosDeep.ts
//  Builds the Helios Deep ancient underground facility.
//  An enormous subterranean chamber housing a mysterious alien machine.
// ============================================================

import * as THREE from 'three';
import {
  PALETTE,
  makeBox,
  makeCylinder,
  makeSphere,
  makeTorus,
  buildFloor,
  buildWall,
  makeRoomLight,
  getMaterial,
} from './WorldObjects.js';

// ---- Tuning constants --------------------------------------------------------

const RING_EMISSIVE_COLOR   = 0x4433cc;
const RING_BASE_COLOR       = 0x1a1228;
const CONDUIT_COLOR         = 0x5544dd;
const CHAMBER_HEIGHT        = 220;
const CHAMBER_RADIUS        = 130;
const MACHINE_OUTER_RADIUS  = 52;
const ACTIVATION_RING_GLOW  = 0x9977ff;

// ── HeliosDeep ────────────────────────────────────────────────────────────────

export class HeliosDeep {
  public group:           THREE.Group   = new THREE.Group();
  public centralMachine:  THREE.Group   = new THREE.Group();
  public energyConduits:  THREE.Group[] = [];
  public rings:           THREE.Group[] = [];
  public activated:       boolean       = false;

  /** Accumulated time used for ring rotation and pulse animations. */
  private _time: number = 0;

  /** Ring rotation axes and speeds — set during build. */
  private _ringAxes:   THREE.Vector3[] = [];
  private _ringSpeeds: number[]        = [];

  /** Floating geometry fragments for individual animation. */
  private _floatingFragments: THREE.Mesh[] = [];
  private _floatingOffsets:   number[]     = [];

  /** Light shafts that pulse with activation. */
  private _lightShafts: THREE.Mesh[] = [];

  /** Emissive materials affected by activation. */
  private _dormantMaterials:   THREE.MeshStandardMaterial[] = [];
  private _activatedMaterials: THREE.MeshStandardMaterial[] = [];

  /** Point lights that intensify on activation. */
  private _ambientLights: THREE.PointLight[] = [];

  constructor() {
    this.group.name = 'HeliosDeep';
  }

  // ── Public entry point ────────────────────────────────────────────────────

  public build(scene: THREE.Scene): void {
    // Entrance corridor feeds into main chamber
    const corridor  = this.buildEntranceCorridor(scene);
    corridor.position.set(0, 0, CHAMBER_RADIUS - 20);
    this.group.add(corridor);

    const chamber = this.buildMainChamber(scene);
    this.group.add(chamber);

    this.buildEnergyConduits(scene);
    this.buildFloatingGeometry(scene);

    const platform = this.buildInterfacePlatform(scene);
    platform.position.set(0, 2, 0);
    this.group.add(platform);

    // Ambient void light — almost nothing
    const ambient = new THREE.AmbientLight(0x0a0814, 0.35);
    this.group.add(ambient);

    scene.add(this.group);
  }

  // ── Room / area builders ──────────────────────────────────────────────────

  public buildEntranceCorridor(scene: THREE.Scene): THREE.Group {
    const corridor = new THREE.Group();
    corridor.name  = 'entranceCorridor';

    const corridorLength = 60;
    const corridorW      = 8;
    const corridorH      = 14;

    // Floor
    const floor = buildFloor(corridorW, corridorLength, 0x0d0d12);
    corridor.add(floor);

    // Ceiling
    const ceilGeo = new THREE.PlaneGeometry(corridorW, corridorLength);
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 0.9 });
    const ceil    = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x    = Math.PI / 2;
    ceil.position.y    = corridorH;
    ceil.receiveShadow = true;
    corridor.add(ceil);

    // Walls
    for (const side of [-1, 1]) {
      const wallGeo = new THREE.PlaneGeometry(corridorLength, corridorH);
      const wallMat = new THREE.MeshStandardMaterial({ color: RING_BASE_COLOR, roughness: 0.85, side: THREE.FrontSide });
      const wall    = new THREE.Mesh(wallGeo, wallMat);
      wall.rotation.y    = side * Math.PI / 2;
      wall.position.set(side * corridorW / 2, corridorH / 2, 0);
      wall.receiveShadow = true;
      corridor.add(wall);
    }

    // Arch ribs running along ceiling
    const ribCount = Math.floor(corridorLength / 6);
    for (let i = 0; i < ribCount; i++) {
      const z = -corridorLength / 2 + i * (corridorLength / ribCount) + 3;
      const rib = makeTorus(corridorW * 0.55, 0.22, 6, 20, RING_BASE_COLOR,
        { roughness: 0.7, metalness: 0.8 });
      rib.position.set(0, corridorH * 0.75, z);
      rib.rotation.z = Math.PI / 2;
      rib.scale.y    = 0.5; // flatten into an arch
      corridor.add(rib);
    }

    // Running light strips on floor edges
    for (const side of [-1, 1]) {
      const strip = makeBox(0.12, 0.06, corridorLength, RING_EMISSIVE_COLOR, {
        roughness: 0.1, metalness: 0.0,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.6,
      });
      strip.position.set(side * (corridorW / 2 - 0.15), 0.05, 0);
      corridor.add(strip);
      this._dormantMaterials.push(strip.material as THREE.MeshStandardMaterial);
    }

    // Hieroglyphic-style panel markings on walls
    for (let i = 0; i < 6; i++) {
      const panel = makeBox(1.8, 2.5, 0.06, 0x1a1230, {
        roughness: 0.6, metalness: 0.4,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.15,
      });
      const z = -corridorLength / 2 + 10 + i * 8;
      panel.position.set((i % 2 === 0 ? 1 : -1) * (corridorW / 2 - 0.08), corridorH * 0.5, z);
      panel.rotation.y = (i % 2 === 0 ? -1 : 1) * Math.PI / 2;
      this._dormantMaterials.push(panel.material as THREE.MeshStandardMaterial);
      corridor.add(panel);
    }

    // Dim point lights spaced along corridor
    const lightPositions = [-20, 0, 20];
    for (const lz of lightPositions) {
      const pt = new THREE.PointLight(RING_EMISSIVE_COLOR, 0.8, 20);
      pt.position.set(0, corridorH * 0.8, lz);
      this._ambientLights.push(pt);
      corridor.add(pt);
    }

    return corridor;
  }

  public buildMainChamber(scene: THREE.Scene): THREE.Group {
    const chamber = new THREE.Group();
    chamber.name  = 'mainChamber';

    // Cylindrical rock walls
    const wallGeo = new THREE.CylinderGeometry(
      CHAMBER_RADIUS, CHAMBER_RADIUS + 8, CHAMBER_HEIGHT, 64, 1, true,
    );
    const wallMat = new THREE.MeshStandardMaterial({
      color:     0x0c0c14,
      roughness: 0.95,
      metalness: 0.0,
      side:      THREE.BackSide,
    });
    const walls = new THREE.Mesh(wallGeo, wallMat);
    walls.position.y    = CHAMBER_HEIGHT / 2 - 2;
    walls.receiveShadow = true;
    chamber.add(walls);

    // Massive floor
    const floorGeo = new THREE.CircleGeometry(CHAMBER_RADIUS + 5, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color:     0x080810,
      roughness: 1.0,
      metalness: 0.0,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x    = -Math.PI / 2;
    floor.receiveShadow = true;
    chamber.add(floor);

    // Ceiling — vaulted stone arch
    const ceilGeo = new THREE.SphereGeometry(CHAMBER_RADIUS * 0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const ceilMat = new THREE.MeshStandardMaterial({
      color:     0x0a0a12,
      roughness: 0.95,
      metalness: 0.0,
      side:      THREE.BackSide,
    });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.position.y = CHAMBER_HEIGHT;
    chamber.add(ceil);

    // Build the machine INSIDE the chamber
    const machine = this.buildCentralMachine(scene);
    machine.position.y = 12;
    this.centralMachine = machine;
    chamber.add(machine);

    // Stepped platform base that the machine sits on
    const stepCount = 5;
    for (let s = 0; s < stepCount; s++) {
      const stepR = MACHINE_OUTER_RADIUS * 0.65 - s * 5;
      const stepH = 0.8;
      const step = makeCylinder(stepR, stepR + 1, stepH, 48, 0x12101c, { roughness: 0.8, metalness: 0.3 });
      step.position.y = s * stepH;
      chamber.add(step);
    }

    // Grand staircase from entrance to machine
    const stairCount = 24;
    for (let i = 0; i < stairCount; i++) {
      const stair = makeBox(10, 0.4, 2.0, 0x141220, { roughness: 0.9, metalness: 0.1 });
      stair.position.set(0, i * 0.3, CHAMBER_RADIUS * 0.65 - i * 2.5 - 10);
      chamber.add(stair);
    }

    // Wall buttresses
    const buttressCount = 12;
    for (let i = 0; i < buttressCount; i++) {
      const angle = (i / buttressCount) * Math.PI * 2;
      const bx    = Math.sin(angle) * (CHAMBER_RADIUS - 3);
      const bz    = Math.cos(angle) * (CHAMBER_RADIUS - 3);

      const buttress = makeBox(4, CHAMBER_HEIGHT * 0.55, 5, 0x0e0c18, { roughness: 0.9, metalness: 0.15 });
      buttress.position.set(bx, CHAMBER_HEIGHT * 0.275, bz);
      buttress.rotation.y = -angle;
      chamber.add(buttress);

      // Emissive vein up the buttress
      const vein = makeBox(0.25, CHAMBER_HEIGHT * 0.45, 0.25, RING_EMISSIVE_COLOR, {
        roughness: 0.1, metalness: 0.0,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.35,
      });
      vein.position.set(bx * 0.97, CHAMBER_HEIGHT * 0.275, bz * 0.97);
      vein.rotation.y = -angle;
      this._dormantMaterials.push(vein.material as THREE.MeshStandardMaterial);
      chamber.add(vein);
    }

    // Light shafts from ceiling — cylindrical transparent cones
    const shaftCount = 6;
    for (let i = 0; i < shaftCount; i++) {
      const angle   = (i / shaftCount) * Math.PI * 2;
      const radius  = CHAMBER_RADIUS * 0.55;
      const shaftGeo = new THREE.ConeGeometry(4, CHAMBER_HEIGHT * 0.6, 16, 1, true);
      const shaftMat = new THREE.MeshStandardMaterial({
        color:       0x8866ff,
        transparent: true,
        opacity:     0.04,
        emissive:    new THREE.Color(0x4433cc),
        emissiveIntensity: 0.6,
        side:        THREE.DoubleSide,
        depthWrite:  false,
      });
      const shaft = new THREE.Mesh(shaftGeo, shaftMat);
      shaft.position.set(
        Math.sin(angle) * radius,
        CHAMBER_HEIGHT * 0.7,
        Math.cos(angle) * radius,
      );
      this._lightShafts.push(shaft);
      this._dormantMaterials.push(shaftMat);
      chamber.add(shaft);
    }

    // Chamber ambience lights — very faint purple
    const chamberLight = new THREE.PointLight(RING_EMISSIVE_COLOR, 1.5, CHAMBER_RADIUS * 1.5);
    chamberLight.position.set(0, CHAMBER_HEIGHT * 0.4, 0);
    this._ambientLights.push(chamberLight);
    chamber.add(chamberLight);

    return chamber;
  }

  public buildCentralMachine(scene: THREE.Scene): THREE.Group {
    const machine = new THREE.Group();
    machine.name  = 'centralMachine';

    // ── Concentric rings ─────────────────────────────────────────────────

    const ringConfigs: Array<{
      radius:    number;
      tube:      number;
      radSeg:    number;
      tubeSeg:   number;
      speed:     number;
      axis:      THREE.Vector3;
      emissive:  number;
      emissInt:  number;
    }> = [
      { radius: 20, tube: 0.9, radSeg: 10, tubeSeg: 80, speed: 0.08,  axis: new THREE.Vector3(0, 1, 0),           emissive: RING_EMISSIVE_COLOR, emissInt: 1.2 },
      { radius: 30, tube: 0.7, radSeg: 8,  tubeSeg: 96, speed: -0.055, axis: new THREE.Vector3(1, 0.3, 0).normalize(), emissive: RING_EMISSIVE_COLOR, emissInt: 1.0 },
      { radius: 38, tube: 0.6, radSeg: 8,  tubeSeg: 96, speed: 0.04,  axis: new THREE.Vector3(0.4, 0, 1).normalize(), emissive: 0x3322aa,             emissInt: 0.8 },
      { radius: 45, tube: 0.5, radSeg: 8,  tubeSeg: 128, speed: -0.03, axis: new THREE.Vector3(0, 0.5, 1).normalize(), emissive: 0x221166,            emissInt: 0.6 },
      { radius: MACHINE_OUTER_RADIUS, tube: 0.45, radSeg: 6, tubeSeg: 128, speed: 0.018, axis: new THREE.Vector3(0.3, 1, 0.3).normalize(), emissive: 0x1a0d55, emissInt: 0.4 },
    ];

    for (let i = 0; i < ringConfigs.length; i++) {
      const cfg  = ringConfigs[i];
      const rGrp = new THREE.Group();
      rGrp.name  = `ring_${i}`;

      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, cfg.radSeg, cfg.tubeSeg);
      const mat = new THREE.MeshStandardMaterial({
        color:             RING_BASE_COLOR,
        roughness:         0.35,
        metalness:         0.85,
        emissive:          new THREE.Color(cfg.emissive),
        emissiveIntensity: cfg.emissInt,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.castShadow    = true;
      ring.receiveShadow = true;

      // Surface detail: notch markers around the ring
      const notchCount = 12 + i * 4;
      for (let n = 0; n < notchCount; n++) {
        const notchAngle = (n / notchCount) * Math.PI * 2;
        const notch = makeBox(
          cfg.tube * 2.5, cfg.tube * 0.8, cfg.tube * 1.5,
          0x0a0820, { roughness: 0.7, metalness: 0.9 },
        );
        notch.position.set(
          Math.cos(notchAngle) * cfg.radius,
          0,
          Math.sin(notchAngle) * cfg.radius,
        );
        notch.rotation.y = -notchAngle;
        rGrp.add(notch);
      }

      rGrp.add(ring);
      this._dormantMaterials.push(mat);
      this._activatedMaterials.push(mat);

      // Align ring to its rotation axis
      rGrp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cfg.axis);

      this._ringAxes.push(cfg.axis.clone());
      this._ringSpeeds.push(cfg.speed);
      this.rings.push(rGrp);
      machine.add(rGrp);
    }

    // ── Central orb ─────────────────────────────────────────────────────

    const orbOuter = makeSphere(8, 32, RING_EMISSIVE_COLOR, {
      roughness:         0.05,
      metalness:         0.0,
      emissive:          RING_EMISSIVE_COLOR,
      emissiveIntensity: 1.8,
      transparent:       true,
      opacity:           0.7,
    });
    orbOuter.name = 'orbOuter';
    this._dormantMaterials.push(orbOuter.material as THREE.MeshStandardMaterial);
    machine.add(orbOuter);

    const orbInner = makeSphere(5.5, 24, 0xffffff, {
      roughness:         0.0,
      metalness:         0.0,
      emissive:          0xffffff,
      emissiveIntensity: 3.0,
      transparent:       true,
      opacity:           0.5,
    });
    orbInner.name = 'orbInner';
    machine.add(orbInner);

    // Orb point light
    const orbLight = new THREE.PointLight(0x8866ff, 3.0, 80);
    orbLight.position.set(0, 0, 0);
    orbLight.castShadow         = true;
    orbLight.shadow.mapSize.set(512, 512);
    this._ambientLights.push(orbLight);
    machine.add(orbLight);

    // ── Inner cross structures ────────────────────────────────────────────

    const crossColors = [0x2211aa, 0x3322bb, 0x1a0d88];
    for (let i = 0; i < 3; i++) {
      const crossRing = makeTorus(12 + i * 3, 0.45, 6, 48, crossColors[i], {
        roughness: 0.3, metalness: 0.9,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.7,
      });
      crossRing.rotation.x = (i / 3) * Math.PI;
      crossRing.rotation.y = (i / 3) * Math.PI * 0.7;
      this._dormantMaterials.push(crossRing.material as THREE.MeshStandardMaterial);
      machine.add(crossRing);
    }

    // ── Spire columns from machine base ───────────────────────────────────

    const spireCount = 8;
    for (let i = 0; i < spireCount; i++) {
      const angle = (i / spireCount) * Math.PI * 2;
      const dist  = MACHINE_OUTER_RADIUS * 0.55;

      const spire = makeCylinder(0.3, 1.5, 25, 6, 0x0d0b1a, { roughness: 0.7, metalness: 0.6 });
      spire.position.set(Math.sin(angle) * dist, -12, Math.cos(angle) * dist);
      machine.add(spire);

      // Emissive tip
      const tip = makeSphere(0.9, 8, RING_EMISSIVE_COLOR, {
        roughness: 0.1, metalness: 0.0,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 1.5,
      });
      tip.position.set(Math.sin(angle) * dist, 0.5, Math.cos(angle) * dist);
      this._dormantMaterials.push(tip.material as THREE.MeshStandardMaterial);
      machine.add(tip);
    }

    return machine;
  }

  public buildEnergyConduits(scene: THREE.Scene): void {
    const conduitCount = 8;
    for (let i = 0; i < conduitCount; i++) {
      const angle  = (i / conduitCount) * Math.PI * 2;
      const conduit = new THREE.Group();
      conduit.name  = `conduit_${i}`;

      // Main conduit tube running from machine out to wall
      const length = CHAMBER_RADIUS * 0.72;
      const geo    = new THREE.CylinderGeometry(0.4, 0.6, length, 8);
      const mat    = new THREE.MeshStandardMaterial({
        color:             0x110d22,
        roughness:         0.4,
        metalness:         0.8,
        emissive:          new THREE.Color(CONDUIT_COLOR),
        emissiveIntensity: 0.5,
      });
      const tube = new THREE.Mesh(geo, mat);
      tube.rotation.z = Math.PI / 2;
      tube.castShadow = true;

      conduit.add(tube);
      this._dormantMaterials.push(mat);

      // Position the conduit radiating from machine
      conduit.position.set(
        Math.sin(angle) * (MACHINE_OUTER_RADIUS + length / 2),
        4 + Math.sin(i * 0.9) * 3, // slight height variation
        Math.cos(angle) * (MACHINE_OUTER_RADIUS + length / 2),
      );
      conduit.rotation.y = -angle;

      // Pulse nodes along conduit
      const nodeCount = 5;
      for (let n = 0; n < nodeCount; n++) {
        const t     = n / (nodeCount - 1);
        const nDist = -length / 2 + t * length;
        const node  = makeSphere(0.6, 8, CONDUIT_COLOR, {
          roughness: 0.1, metalness: 0.0,
          emissive: CONDUIT_COLOR, emissiveIntensity: 1.0,
        });
        node.position.set(nDist, 0, 0);
        node.userData['pulseOffset'] = n * 0.4 + i * 0.2;
        this._dormantMaterials.push(node.material as THREE.MeshStandardMaterial);
        conduit.add(node);
      }

      this.energyConduits.push(conduit);
      this.group.add(conduit);
    }
  }

  public buildFloatingGeometry(scene: THREE.Scene): void {
    // Ancient stone-like floating debris around the machine
    const fragmentConfigs: Array<{
      geo:   THREE.BufferGeometry;
      scale: number;
      x:     number;
      y:     number;
      z:     number;
    }> = [];

    // Octahedra
    for (let i = 0; i < 14; i++) {
      const angle  = (i / 14) * Math.PI * 2;
      const radius = MACHINE_OUTER_RADIUS * (0.7 + Math.random() * 0.6);
      const height = 10 + Math.random() * 50;
      fragmentConfigs.push({
        geo:   new THREE.OctahedronGeometry(1, 0),
        scale: 1.5 + Math.random() * 4.0,
        x:     Math.sin(angle) * radius,
        y:     height,
        z:     Math.cos(angle) * radius,
      });
    }

    // Tetrahedra
    for (let i = 0; i < 10; i++) {
      const angle  = (i / 10) * Math.PI * 2 + 0.3;
      const radius = MACHINE_OUTER_RADIUS * (0.5 + Math.random() * 0.85);
      fragmentConfigs.push({
        geo:   new THREE.TetrahedronGeometry(1, 0),
        scale: 2.0 + Math.random() * 5.0,
        x:     Math.sin(angle) * radius,
        y:     15 + Math.random() * 80,
        z:     Math.cos(angle) * radius,
      });
    }

    // Dodecahedra
    for (let i = 0; i < 6; i++) {
      const angle  = (i / 6) * Math.PI * 2 + 0.6;
      const radius = MACHINE_OUTER_RADIUS * (0.3 + Math.random() * 1.1);
      fragmentConfigs.push({
        geo:   new THREE.DodecahedronGeometry(1, 0),
        scale: 3.0 + Math.random() * 7.0,
        x:     Math.sin(angle) * radius,
        y:     30 + Math.random() * 120,
        z:     Math.cos(angle) * radius,
      });
    }

    // Create meshes
    for (let i = 0; i < fragmentConfigs.length; i++) {
      const cfg = fragmentConfigs[i];
      const mat = new THREE.MeshStandardMaterial({
        color:             0x1a1428,
        roughness:         0.8,
        metalness:         0.4,
        emissive:          new THREE.Color(RING_EMISSIVE_COLOR),
        emissiveIntensity: 0.08 + Math.random() * 0.15,
      });
      const mesh = new THREE.Mesh(cfg.geo, mat);
      mesh.scale.setScalar(cfg.scale);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );
      mesh.castShadow = true;

      this._floatingFragments.push(mesh);
      this._floatingOffsets.push(Math.random() * Math.PI * 2);
      this._dormantMaterials.push(mat);
      this.group.add(mesh);
    }

    // Larger floating stone pillars
    for (let i = 0; i < 6; i++) {
      const angle   = (i / 6) * Math.PI * 2;
      const dist    = CHAMBER_RADIUS * 0.58;
      const pillarH = 18 + Math.random() * 28;

      const pillar = makeCylinder(1.2, 2.0, pillarH, 6, 0x141022, {
        roughness: 0.85, metalness: 0.2,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.05,
      });
      pillar.position.set(
        Math.sin(angle) * dist,
        40 + Math.random() * 60,
        Math.cos(angle) * dist,
      );
      pillar.rotation.x = (Math.random() - 0.5) * 0.3;
      pillar.rotation.z = (Math.random() - 0.5) * 0.3;

      this._floatingFragments.push(pillar);
      this._floatingOffsets.push(Math.random() * Math.PI * 2);
      this._dormantMaterials.push(pillar.material as THREE.MeshStandardMaterial);
      this.group.add(pillar);
    }
  }

  public buildInterfacePlatform(scene: THREE.Scene): THREE.Group {
    const platform = new THREE.Group();
    platform.name  = 'interfacePlatform';

    // Elevated platform in front of the machine
    const platformBase = makeCylinder(8, 9, 1.2, 12, 0x151020, { roughness: 0.7, metalness: 0.5 });
    platformBase.position.y = 0.6;
    platform.add(platformBase);

    // Inlay rune circles
    for (let r = 0; r < 3; r++) {
      const rune = makeTorus(2 + r * 2, 0.08, 4, 32, RING_EMISSIVE_COLOR, {
        roughness: 0.1, metalness: 0.0,
        emissive: RING_EMISSIVE_COLOR, emissiveIntensity: 0.5,
      });
      rune.rotation.x = Math.PI / 2;
      rune.position.y = 1.22;
      this._dormantMaterials.push(rune.material as THREE.MeshStandardMaterial);
      platform.add(rune);
    }

    // Central interface console
    const console_ = makeBox(1.4, 1.2, 0.9, 0x1a1030, { roughness: 0.5, metalness: 0.6 });
    console_.position.set(0, 1.8, 5);
    platform.add(console_);

    // Interface screen
    const screen = makeBox(1.1, 0.75, 0.06, ACTIVATION_RING_GLOW, {
      roughness: 0.05, metalness: 0.0,
      emissive: ACTIVATION_RING_GLOW, emissiveIntensity: 1.5,
    });
    screen.position.set(0, 2.45, 5.46);
    screen.name = 'interfaceScreen';
    this._dormantMaterials.push(screen.material as THREE.MeshStandardMaterial);
    platform.add(screen);

    // Choice symbols — two glowing symbols on either side
    const symbolColors = [0x00ff88, 0xff4400]; // preserve = green, awaken = orange
    const symbolLabels = ['preserve', 'awaken'];
    for (let s = 0; s < 2; s++) {
      const sym = makeSphere(0.6, 12, symbolColors[s], {
        roughness: 0.1, metalness: 0.0,
        emissive: symbolColors[s], emissiveIntensity: 2.0,
      });
      sym.position.set((s === 0 ? -1 : 1) * 2.0, 2.6, 4.5);
      sym.name = `choiceSymbol_${symbolLabels[s]}`;
      platform.add(sym);
    }

    // Stairway up to platform
    const stairH = 0.28;
    for (let i = 0; i < 5; i++) {
      const step = makeBox(4.0, stairH, 0.9, 0x12101a, { roughness: 0.9, metalness: 0.1 });
      step.position.set(0, i * stairH, 9.5 - i * 0.95);
      platform.add(step);
    }

    // Platform position — south of the machine
    platform.position.set(0, 2, MACHINE_OUTER_RADIUS * 0.6 + 8);

    return platform;
  }

  // ── Activation sequence ───────────────────────────────────────────────────

  public activate(): void {
    if (this.activated) return;
    this.activated = true;

    // Immediately boost all dormant material emissive intensities
    for (const mat of this._dormantMaterials) {
      mat.emissiveIntensity *= 3.5;
    }

    // Max out ambient lights
    for (const lt of this._ambientLights) {
      lt.intensity *= 4.0;
    }

    // Increase ring speeds dramatically
    for (let i = 0; i < this._ringSpeeds.length; i++) {
      this._ringSpeeds[i] *= 3.0;
    }

    // Light shafts become opaque
    for (const shaft of this._lightShafts) {
      (shaft.material as THREE.MeshStandardMaterial).opacity          = 0.18;
      (shaft.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.0;
    }
  }

  // ── Update loop ───────────────────────────────────────────────────────────

  public update(delta: number, time: number): void {
    this._time = time;

    // Rotate rings — each on its own axis and at its own speed
    for (let i = 0; i < this.rings.length; i++) {
      this.rings[i].rotateOnAxis(this._ringAxes[i], this._ringSpeeds[i] * delta);
    }

    // Pulse orb
    this.centralMachine.traverse(child => {
      if (child.name === 'orbOuter' && child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        const baseInt = this.activated ? 4.0 : 1.8;
        mat.emissiveIntensity = baseInt + Math.sin(time * 1.8) * 0.6;
        const scale = 1.0 + Math.sin(time * 1.4) * 0.04;
        child.scale.setScalar(scale);
      }
      if (child.name === 'orbInner' && child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = (this.activated ? 6.0 : 3.0) + Math.sin(time * 3.5) * 1.5;
      }
    });

    // Animate floating geometry — gentle bob and slow rotation
    for (let i = 0; i < this._floatingFragments.length; i++) {
      const frag   = this._floatingFragments[i];
      const offset = this._floatingOffsets[i];
      frag.position.y += Math.sin(time * 0.18 + offset) * delta * 0.4;
      frag.rotation.y  += delta * (0.04 + offset * 0.01);
      frag.rotation.x  += delta * 0.015;
    }

    // Pulse conduit nodes in sequence (travelling wave effect)
    for (const conduit of this.energyConduits) {
      conduit.children.forEach(child => {
        if (child.userData['pulseOffset'] !== undefined && child instanceof THREE.Mesh) {
          const t   = child.userData['pulseOffset'] as number;
          const mat = child.material as THREE.MeshStandardMaterial;
          const base = this.activated ? 2.5 : 1.0;
          mat.emissiveIntensity = base + Math.sin(time * 2.5 - t) * 0.8;
        }
      });
    }

    // Light shaft opacity pulse
    for (const shaft of this._lightShafts) {
      const mat = shaft.material as THREE.MeshStandardMaterial;
      const base = this.activated ? 0.18 : 0.04;
      mat.opacity = base + Math.sin(time * 0.9 + shaft.position.x * 0.1) * (base * 0.3);
    }

    // Orb light pulse
    for (const lt of this._ambientLights) {
      if (lt.position.length() < 1) {
        // Central orb light
        const base = this.activated ? 8.0 : 3.0;
        lt.intensity = base + Math.sin(time * 2.0) * (base * 0.25);
      }
    }
  }

  // ── Disposal ──────────────────────────────────────────────────────────────

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
    this.rings              = [];
    this.energyConduits     = [];
    this._floatingFragments = [];
    this._floatingOffsets   = [];
    this._lightShafts       = [];
    this._dormantMaterials  = [];
    this._activatedMaterials = [];
    this._ambientLights     = [];
    this._ringAxes          = [];
    this._ringSpeeds        = [];
  }
}
