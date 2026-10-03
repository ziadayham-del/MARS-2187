/**
 * missions.ts
 * MARS: 2187 — Complete mission and objective definitions for all chapters.
 */

import { Chapter } from './story';

// ---------------------------------------------------------------------------
// Enums & Interfaces
// ---------------------------------------------------------------------------

export enum MissionStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE   = 'ACTIVE',
  COMPLETE = 'COMPLETE',
  FAILED   = 'FAILED',
}

export enum ObjectiveType {
  INTERACT  = 'INTERACT',
  REACH     = 'REACH',
  REPAIR    = 'REPAIR',
  DISCOVER  = 'DISCOVER',
  CHOICE    = 'CHOICE',
}

export interface Objective {
  id: string;
  type: ObjectiveType;
  description: string;
  completed: boolean;
  optional: boolean;
}

export interface Mission {
  id: string;
  chapter: Chapter;
  title: string;
  subtitle: string;
  objectives: Objective[];
  rewards: string[];           // Lore entry IDs unlocked on completion
  completionMessage: string;
  status: MissionStatus;
}

// ---------------------------------------------------------------------------
// Mission Data
// ---------------------------------------------------------------------------

export const MISSIONS: Mission[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // CHAPTER 1 — DESCENT
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-101',
    chapter: Chapter.DESCENT,
    title: 'Hard Landing',
    subtitle: 'Stabilise the recovery vessel and establish a safe egress route.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-101-01',
        type: ObjectiveType.INTERACT,
        description: 'Access the ship\'s emergency control panel and halt thruster venting.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-101-02',
        type: ObjectiveType.INTERACT,
        description: 'Seal the hull breach in Compartment C using the emergency patch kit.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-101-03',
        type: ObjectiveType.INTERACT,
        description: 'Activate ORION\'s full sensor suite from the navigation console.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-101-04',
        type: ObjectiveType.REACH,
        description: 'Retrieve your EVA suit from the equipment locker.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-101-05',
        type: ObjectiveType.INTERACT,
        description: 'Uplink the vessel\'s mission log to ORION\'s data core.',
        completed: false,
        optional: true,
      },
    ],
    rewards: [],
    completionMessage:
      'The Ananke is stable. Systems are holding. ORION is online. The colony is 140 metres across the basin floor. Whatever happened here, the answers are in there.',
  },

  {
    id: 'MSN-102',
    chapter: Chapter.DESCENT,
    title: 'First Steps',
    subtitle: 'Cross the Martian surface and breach the colony airlock.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-102-01',
        type: ObjectiveType.REACH,
        description: 'Exit the vessel via the forward airlock.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-102-02',
        type: ObjectiveType.REACH,
        description: 'Cross the basin floor to the colony\'s primary airlock.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-102-03',
        type: ObjectiveType.INTERACT,
        description: 'Override the colony airlock\'s manual lock using the bypass tool.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-102-04',
        type: ObjectiveType.DISCOVER,
        description: 'Locate and read the colony\'s memorial plaque in the entrance hall.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['COL-001'],
    completionMessage:
      'You are inside Aurelia Colony. The air is thin and cold, but breathable for now. The lights are off. The silence is total. Begin your search.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHAPTER 2 — SILENT CITY
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-201',
    chapter: Chapter.SILENT_CITY,
    title: 'Rekindle',
    subtitle: 'Restart the fusion reactor and restore primary power to the colony.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-201-01',
        type: ObjectiveType.REACH,
        description: 'Reach the Engineering Wing via the Ring Corridor.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-201-02',
        type: ObjectiveType.INTERACT,
        description: 'Restore power to the first reactor control node in the outer ring.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-201-03',
        type: ObjectiveType.INTERACT,
        description: 'Restore power to the second reactor control node in the maintenance sublevel.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-201-04',
        type: ObjectiveType.INTERACT,
        description: 'Restore power to the third reactor control node in the reactor hall.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-201-05',
        type: ObjectiveType.INTERACT,
        description: 'Initiate plasma ignition sequence at the ARC-3 main control panel.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-201-06',
        type: ObjectiveType.DISCOVER,
        description: 'Read the reactor architecture documentation on the engineering terminal.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ENG-004', 'COL-002'],
    completionMessage:
      'ARC-3 is online. Lights are restoring across the colony. 11.8 megawatts of power is flowing into a facility with no one to use it. The next problem is air.',
  },

  {
    id: 'MSN-202',
    chapter: Chapter.SILENT_CITY,
    title: 'Breathe',
    subtitle: 'Restart the atmospheric oxygen generation systems.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-202-01',
        type: ObjectiveType.REACH,
        description: 'Locate the primary oxygen generation module in Sector Alpha\'s utility level.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-202-02',
        type: ObjectiveType.REPAIR,
        description: 'Reconnect the severed power conduit supplying the primary oxygen module.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-202-03',
        type: ObjectiveType.REACH,
        description: 'Locate the secondary oxygen generation module in Sector Delta.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-202-04',
        type: ObjectiveType.INTERACT,
        description: 'Restart the secondary module via its local control panel.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-202-05',
        type: ObjectiveType.INTERACT,
        description: 'Access the atmospheric control panel to verify colony-wide oxygen readings.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['ENG-002'],
    completionMessage:
      'Atmospheric generation is restored. Oxygen levels are climbing. Someone deliberately disabled these systems. ORION wants you to think about what that means for how the crisis unfolded.',
  },

  {
    id: 'MSN-203',
    chapter: Chapter.SILENT_CITY,
    title: 'Voices in the Dark',
    subtitle: 'Recover crew personal logs from across the colony.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-203-01',
        type: ObjectiveType.DISCOVER,
        description: 'Access the personal log terminal in Chief Engineer Volkov\'s office.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-203-02',
        type: ObjectiveType.DISCOVER,
        description: 'Access the personal log terminal in Dr. Mehta\'s laboratory.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-203-03',
        type: ObjectiveType.DISCOVER,
        description: 'Access the personal log terminal in Commander Mori\'s quarters.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-203-04',
        type: ObjectiveType.DISCOVER,
        description: 'Find Kenji Watanabe\'s handwritten notes in the maintenance workshop.',
        completed: false,
        optional: true,
      },
      {
        id: 'OBJ-203-05',
        type: ObjectiveType.DISCOVER,
        description: 'Read the evacuation records in the Emergency Operations Room.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['PER-001', 'PER-002', 'PER-003', 'PER-004', 'COL-003'],
    completionMessage:
      'You have read what they left behind. They were frightened and careful and they tried to do the right thing. Now you know what they found. Follow the same trail.',
  },

  {
    id: 'MSN-204',
    chapter: Chapter.SILENT_CITY,
    title: 'Control Room',
    subtitle: 'Access the colony control center and retrieve the encrypted command archive.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-204-01',
        type: ObjectiveType.REACH,
        description: 'Navigate to the Colony Control Center in the central hub.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-204-02',
        type: ObjectiveType.INTERACT,
        description: 'Restore power to the control center\'s main data terminal.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-204-03',
        type: ObjectiveType.INTERACT,
        description: 'Run ORION\'s decryption routine on the classified command archive.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-204-04',
        type: ObjectiveType.DISCOVER,
        description: 'Review the colony facility map and identify all restricted zones.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ANO-001', 'COL-002'],
    completionMessage:
      'The archive is partially decrypted. There is a signal. It has been here longer than the colony. And it is getting louder.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHAPTER 3 — CONTINUITY
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-301',
    chapter: Chapter.CONTINUITY,
    title: 'Ghost Signal',
    subtitle: 'Trace the encrypted data signal embedded in the colony\'s data core.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-301-01',
        type: ObjectiveType.REACH,
        description: 'Access the colony\'s main data core in the Control Center sub-basement.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-301-02',
        type: ObjectiveType.INTERACT,
        description: 'Connect ORION\'s analysis module to the data core\'s primary bus.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-301-03',
        type: ObjectiveType.DISCOVER,
        description: 'Locate the buried network node described in the decrypted archive.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-301-04',
        type: ObjectiveType.INTERACT,
        description: 'Interface with the network node to extract the signal\'s full frequency analysis.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['ANO-002', 'ANO-005'],
    completionMessage:
      'The signal is a map. 1,024 points distributed across the planet. One of them is 340 kilometres away. The colony\'s rover was sent there six weeks ago. The rover came back. Its crew\'s report was never filed.',
  },

  {
    id: 'MSN-302',
    chapter: Chapter.CONTINUITY,
    title: 'Protocol',
    subtitle: 'Find and access the Continuity Protocol data archive.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-302-01',
        type: ObjectiveType.REACH,
        description: 'Descend to the B3 maintenance sublevel via the service elevator.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-302-02',
        type: ObjectiveType.DISCOVER,
        description: 'Locate the sealed hatch in the B3 crawlspace described in Watanabe\'s notes.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-302-03',
        type: ObjectiveType.INTERACT,
        description: 'Open the sealed hatch and access the Continuity Protocol archive chamber.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-302-04',
        type: ObjectiveType.INTERACT,
        description: 'Extract Commander Mori\'s encrypted briefing from the hardened archive.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-302-05',
        type: ObjectiveType.DISCOVER,
        description: 'Examine the door in the B3 bedrock wall.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ANO-003', 'ENG-005'],
    completionMessage:
      'Commander Mori knew. He found the interface. He chose to wait for Earth\'s guidance. Earth never responded in time. Now the decision passes to you.',
  },

  {
    id: 'MSN-303',
    chapter: Chapter.CONTINUITY,
    title: 'Reach Out',
    subtitle: 'Restore the colony\'s communications uplink.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-303-01',
        type: ObjectiveType.REACH,
        description: 'Access the communications tower via the roof-level service corridor.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-303-02',
        type: ObjectiveType.REPAIR,
        description: 'Reattach the severed main uplink control cable.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-303-03',
        type: ObjectiveType.INTERACT,
        description: 'Transmit a status report to Earth via the restored dish.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-303-04',
        type: ObjectiveType.DISCOVER,
        description: 'Review the archive of Earth transmissions received during the silence.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ENG-005'],
    completionMessage:
      'Earth has been notified of your situation. Response time: 22 to 44 minutes depending on orbital geometry. You will not wait. The rover is in the garage bay. It is time to drive.',
  },

  {
    id: 'MSN-304',
    chapter: Chapter.CONTINUITY,
    title: 'Persistence',
    subtitle: 'Locate M-7-02 and assess its condition.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-304-01',
        type: ObjectiveType.REACH,
        description: 'Navigate to the colony garage bay in Sector Epsilon.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-304-02',
        type: ObjectiveType.DISCOVER,
        description: 'Locate and identify M-7-02 "Persistence" among the colony vehicles.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-304-03',
        type: ObjectiveType.INTERACT,
        description: 'Connect ORION\'s diagnostic suite to the rover\'s onboard computer.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-304-04',
        type: ObjectiveType.DISCOVER,
        description: 'Access the rover\'s navigation log to retrieve the Zone Delta-9 survey data.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-304-05',
        type: ObjectiveType.DISCOVER,
        description: 'Read the M-7 development program documentation in the workshop.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ENG-003', 'ANO-004'],
    completionMessage:
      'You know where the rover has been. You know what it found. Three systems need repair before you can follow. Get to work.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHAPTER 4 — RED HORIZON
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-401',
    chapter: Chapter.RED_HORIZON,
    title: 'Repair Run',
    subtitle: 'Restore M-7-02 to operational condition.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-401-01',
        type: ObjectiveType.REPAIR,
        description: 'Replace the damaged battery management controller in the power bay.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-401-02',
        type: ObjectiveType.REPAIR,
        description: 'Recalibrate the navigation inertial measurement unit.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-401-03',
        type: ObjectiveType.REPAIR,
        description: 'Replace the cracked ground-penetrating radar sensor array on the undercarriage.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-401-04',
        type: ObjectiveType.INTERACT,
        description: 'Run the full pre-launch diagnostic and confirm all systems green.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-401-05',
        type: ObjectiveType.INTERACT,
        description: 'Load emergency EVA supplies into the rover\'s cargo compartment.',
        completed: false,
        optional: true,
      },
    ],
    rewards: [],
    completionMessage:
      'M-7-02 is ready. 580 kilometres of range. 340 kilometres to the target. ORION has locked the coordinates. The garage door is opening.',
  },

  {
    id: 'MSN-402',
    chapter: Chapter.RED_HORIZON,
    title: '340 Kilometres',
    subtitle: 'Drive M-7-02 to Anomaly Zone Delta-9.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-402-01',
        type: ObjectiveType.REACH,
        description: 'Exit the colony garage bay and set the rover\'s heading for Zone Delta-9.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-402-02',
        type: ObjectiveType.REACH,
        description: 'Pass the survey waypoint where the team made initial radar contact.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-402-03',
        type: ObjectiveType.REACH,
        description: 'Navigate the Hellas escarpment at waypoint Bravo.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-402-04',
        type: ObjectiveType.DISCOVER,
        description: 'Investigate the abandoned equipment cache left by the original survey team.',
        completed: false,
        optional: true,
      },
      {
        id: 'OBJ-402-05',
        type: ObjectiveType.REACH,
        description: 'Arrive at Zone Delta-9 and locate the facility entrance.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['ANO-004', 'SCI-003'],
    completionMessage:
      'You are at the entrance. The door is 80 metres below. Ground-penetrating radar confirms the geometry. It confirms the regularity. Nothing natural is this regular.',
  },

  {
    id: 'MSN-403',
    chapter: Chapter.RED_HORIZON,
    title: 'The Door',
    subtitle: 'Descend to the Helios facility entrance.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-403-01',
        type: ObjectiveType.REACH,
        description: 'Locate the natural access shaft that provides descent to the 80-metre level.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-403-02',
        type: ObjectiveType.REACH,
        description: 'Descend the shaft to the facility entrance level.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-403-03',
        type: ObjectiveType.INTERACT,
        description: 'Approach the facility door and allow it to register your presence.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['HEL-001'],
    completionMessage:
      'The door is open. It was waiting for someone to come. It does not distinguish between colonists and recovery personnel. It does not distinguish at all. Step through.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHAPTER 5 — MACHINE UNDER MARS
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-501',
    chapter: Chapter.MACHINE_UNDER_MARS,
    title: 'Into the Dark',
    subtitle: 'Explore the Helios Deep facility entry chamber.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-501-01',
        type: ObjectiveType.REACH,
        description: 'Advance through the entry chamber and document the wall markings.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-501-02',
        type: ObjectiveType.DISCOVER,
        description: 'Allow ORION to complete pattern recognition on the chamber markings.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-501-03',
        type: ObjectiveType.DISCOVER,
        description: 'Locate the passage to the lower facility levels.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-501-04',
        type: ObjectiveType.DISCOVER,
        description: 'Identify the material composing the facility walls.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['HEL-001', 'SCI-003'],
    completionMessage:
      'The markings are a map. Not of Mars. Of everywhere. 847 systems. 847 encounters. This place has done this before. Keep moving. The core chamber is below.',
  },

  {
    id: 'MSN-502',
    chapter: Chapter.MACHINE_UNDER_MARS,
    title: 'Ancient Power',
    subtitle: 'Restore power to the facility\'s deep systems to access the core chamber.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-502-01',
        type: ObjectiveType.REACH,
        description: 'Descend to the facility\'s mid-level power distribution node.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-502-02',
        type: ObjectiveType.INTERACT,
        description: 'Interface with the power node\'s activation mechanism.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-502-03',
        type: ObjectiveType.DISCOVER,
        description: 'Observe the power cascade as it propagates through the network nodes.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-502-04',
        type: ObjectiveType.REACH,
        description: 'Follow the activated corridor to the core chamber access passage.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['HEL-002'],
    completionMessage:
      'The facility is waking up. The signal amplitude is increasing. You have perhaps 90 minutes before it reaches full broadcast power. The core chamber is ahead.',
  },

  {
    id: 'MSN-503',
    chapter: Chapter.MACHINE_UNDER_MARS,
    title: 'Planetary System',
    subtitle: 'Study the planetary network interface and understand the system\'s purpose.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-503-01',
        type: ObjectiveType.REACH,
        description: 'Enter the core chamber.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-503-02',
        type: ObjectiveType.DISCOVER,
        description: 'Allow ORION to analyse the core chamber\'s central processing node.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-503-03',
        type: ObjectiveType.DISCOVER,
        description: 'Decode the purpose of the planetary network from the chamber markings.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-503-04',
        type: ObjectiveType.DISCOVER,
        description: 'Identify the two possible input configurations on the interface.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['HEL-003', 'ANO-002'],
    completionMessage:
      'You understand what this is. A sentinel. A beacon. A test. Perhaps all three. There are two choices. Neither is obviously correct. One must be made.',
  },

  {
    id: 'MSN-504',
    chapter: Chapter.MACHINE_UNDER_MARS,
    title: 'The Final Choice',
    subtitle: 'Decide the fate of the Helios network.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-504-01',
        type: ObjectiveType.REACH,
        description: 'Approach the interface in the core chamber.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-504-02',
        type: ObjectiveType.CHOICE,
        description: 'Choose: PRESERVE — initiate shutdown of the planetary network.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-504-03',
        type: ObjectiveType.CHOICE,
        description: 'Choose: AWAKEN — accelerate the network to full broadcast power.',
        completed: false,
        optional: false,
      },
    ],
    rewards: ['HEL-004'],
    completionMessage:
      'The choice is made. The consequences have already begun. Nothing that happens next can be undone.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EPILOGUE
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'MSN-601',
    chapter: Chapter.EPILOGUE,
    title: 'Aftermath',
    subtitle: 'Return to the surface and transmit your full report to Earth.',
    status: MissionStatus.INACTIVE,
    objectives: [
      {
        id: 'OBJ-601-01',
        type: ObjectiveType.REACH,
        description: 'Ascend from the Helios facility to the surface.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-601-02',
        type: ObjectiveType.INTERACT,
        description: 'Transmit the complete mission archive to Earth via the colony\'s communications dish.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-601-03',
        type: ObjectiveType.REACH,
        description: 'Return to the Ananke and prepare for ascent.',
        completed: false,
        optional: false,
      },
      {
        id: 'OBJ-601-04',
        type: ObjectiveType.DISCOVER,
        description: 'Review ORION\'s post-mission probability analysis.',
        completed: false,
        optional: true,
      },
    ],
    rewards: ['ANO-005', 'HEL-004'],
    completionMessage:
      'Transmission sent. The report is on its way. In 22 minutes, Earth will know everything you know. Until then, the Martian sky is red, the basin is silent, and you are the only person on this planet who knows what lies beneath it.',
  },
];
