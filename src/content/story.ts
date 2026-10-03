/**
 * story.ts
 * MARS: 2187 — Narrative data: chapters, ORION dialogue, story markers.
 * ORION is the player's shipboard AI — calm, precise, and occasionally unsettling.
 */

// ---------------------------------------------------------------------------
// Enums & Interfaces
// ---------------------------------------------------------------------------

export enum Chapter {
  DESCENT            = 'DESCENT',
  SILENT_CITY        = 'SILENT_CITY',
  CONTINUITY         = 'CONTINUITY',
  RED_HORIZON        = 'RED_HORIZON',
  MACHINE_UNDER_MARS = 'MACHINE_UNDER_MARS',
  EPILOGUE           = 'EPILOGUE',
}

export interface ChapterData {
  id: Chapter;
  name: string;
  subtitle: string;
  description: string;
}

export interface StoryMarker {
  id: string;
  chapter: Chapter;
  triggerEvent: string;       // Internal event key that fires this marker
  dialogueKey: string;        // Key into ORION_DIALOGUE to play
  cinematic: boolean;         // Whether to lock player control during playback
  timelinePosition: number;   // 0–1 normalised position within the chapter
}

// ---------------------------------------------------------------------------
// Chapter Data
// ---------------------------------------------------------------------------

export const CHAPTERS: ChapterData[] = [
  {
    id: Chapter.DESCENT,
    name: 'Descent',
    subtitle: 'Sol 936 — Recovery Vessel Ananke, approach vector',
    description:
      'After 45 days of silence from Aurelia Colony, ISA dispatches the recovery vessel ' +
      'Ananke with a single passenger: you, carrying only the AI companion ORION and a ' +
      'mandate to determine what happened. Entry is nominal. Landing is not. The colony sits ' +
      'silent on the Hellas basin floor, its lights dead, its comms dark. You will go in alone.',
  },
  {
    id: Chapter.SILENT_CITY,
    name: 'Silent City',
    subtitle: 'Sol 937 — Aurelia Colony Interior',
    description:
      'Power is out. Oxygen reserves are depleting. 1,147 people lived here — their belongings, ' +
      'their meals, their lives interrupted mid-sentence. To understand what happened, you must ' +
      'first bring the colony back to life. Restart the reactor. Restore the atmosphere. Find the ' +
      'logs the crew left behind. The answers are here, written in absence.',
  },
  {
    id: Chapter.CONTINUITY,
    name: 'Continuity',
    subtitle: 'Sol 938 — Aurelia Colony, Lower Levels',
    description:
      'The crew knew something was coming. They prepared for it. The Continuity Protocol ' +
      'was not a backup plan — it was a message, addressed to whoever came after. ORION has ' +
      'detected an encrypted signal buried in the colony\'s data core. Following it will take ' +
      'you down, into the parts of the colony that were never on any official map.',
  },
  {
    id: Chapter.RED_HORIZON,
    name: 'Red Horizon',
    subtitle: 'Sol 939–940 — Martian Surface, 340 km southeast',
    description:
      'The signal leads outward. Across 340 kilometres of empty Martian desert, to a point ' +
      'in Zone Delta-9 that appears on no chart. M-7-02 is your only way there. It is damaged. ' +
      'You will fix it. You will drive it. The horizon is the same red in every direction, ' +
      'but only one direction leads somewhere that matters.',
  },
  {
    id: Chapter.MACHINE_UNDER_MARS,
    name: 'The Machine Under Mars',
    subtitle: 'Sol 940 — Helios Deep Facility',
    description:
      'Below the desert floor, a structure 1.2 billion years old waits for a decision that ' +
      'was never made. The colonists found it. They chose to wait for instruction. The ' +
      'instruction never came. Now the system is reaching full broadcast power, and the choice ' +
      'belongs to you: silence it, or let it complete what it began before life had complex cells.',
  },
  {
    id: Chapter.EPILOGUE,
    name: 'Epilogue',
    subtitle: 'After',
    description:
      'Whatever you chose, the consequences ripple outward at the speed of light. Earth will ' +
      'know in 22 minutes. Whatever is listening at the signal\'s destination will know in longer. ' +
      'ORION calculates the probabilities. You watch the Martian sky and wait to see if anything ' +
      'changes. Sometimes nothing does. Sometimes everything does.',
  },
];

// ---------------------------------------------------------------------------
// ORION Dialogue
// ---------------------------------------------------------------------------

export const ORION_DIALOGUE: Record<string, string[]> = {

  landing: [
    'Touchdown confirmed. Hull integrity nominal. External temperature: minus 63 Celsius.',
    'I am detecting no active radio transmissions from Aurelia Colony.',
    'No active transmissions. That is consistent with the mission briefing.',
    'I want you to hold that thought — "consistent with the briefing" — because I suspect it will not be consistent for much longer.',
  ],

  aurelia_approach: [
    'Aurelia Colony is 140 metres ahead. The main airlock appears structurally intact.',
    'External lighting is offline. Emergency beacons are offline.',
    'That is unusual. Emergency beacons run on independent battery systems rated for 90 days.',
    'Something drained them. Or deactivated them. I am logging this as a priority anomaly.',
    'Proceed to the airlock. I will monitor your biometrics.',
  ],

  colony_dark: [
    'Primary power is offline. Emergency lighting is also offline.',
    'I am reading trace atmospheric pressure inside the colony — approximately 42 kilopascals. Breathable, but declining.',
    'The reactor performed a controlled shutdown. This was not a failure. Someone, or something, told it to stop.',
    'There is enough residual oxygen for approximately 14 hours at your current metabolic rate.',
    'I recommend we find the reactor before that number gets smaller.',
  ],

  reactor_restored: [
    'Plasma ignition confirmed. ARC-3 is online. Output: 11.8 megawatts.',
    'Primary lighting is restoring across Sectors Alpha through Delta.',
    'Atmospheric pressure is stabilising. Oxygen generation is resuming.',
    'The colony is not dead.',
    'It was only waiting.',
  ],

  welcome_home: [
    'All primary systems are restored. Atmospheric composition is within nominal parameters.',
    'The colony is functional.',
    'I find it notable that a facility designed for 1,147 people is now occupied by one.',
    'I will not offer a word for that feeling. I suspect you already have one.',
  ],

  oxygen_restored: [
    'Oxygen generation modules are at 100% capacity. Atmospheric reserves are refilling.',
    'At current generation rate, the colony will reach safe atmospheric density in approximately 4 hours.',
    'I should note: the oxygen generation system was not damaged. It was manually disabled.',
    'Someone turned off the air. Then left. I am still calculating the implications of that sequence of events.',
  ],

  logs_found: [
    'I have accessed the crew personal log archive.',
    'There are 847 entries. The most recent is dated Sol 891 — one sol before the emergency broadcast.',
    'Commander Mori\'s entries are encrypted at ISA-ALPHA-7 level. I am working on that.',
    'The unencrypted entries are... illuminating.',
    'I recommend you read them. Not because ISA protocol requires it. Because they were people, and they were frightened, and they wrote it down.',
  ],

  rover_found: [
    'M-7-02. Ares-class pressurised rover. Serial designation "Persistence."',
    'Manufacture date: 2174. Local fabrication. Chief Engineer Volkov\'s team.',
    'The vehicle has sustained damage consistent with an uncontrolled impact at moderate speed.',
    'The navigation system\'s final logged coordinates are 340 kilometres southeast of our current position.',
    'That is Anomaly Zone Delta-9.',
  ],

  rover_repaired: [
    'M-7-02 is operational. Drive systems at 94%. Navigation at 100%. Atmospheric systems at 100%.',
    'Range at current charge: 580 kilometres.',
    'The destination is 340 kilometres. The return trip is 340 kilometres.',
    'The arithmetic is comfortable. I am less comfortable about what we will find when we get there.',
    'You are driving. I will navigate. Let\'s go.',
  ],

  helios_approach: [
    'We are 2 kilometres from the coordinates. Ground-penetrating radar is detecting a significant void space at 80 metres depth.',
    'Geometric regularity of the void boundaries exceeds any known natural formation by a factor I cannot express as a ratio.',
    'There is an entrance. It is not hidden. It has been here for 1.2 billion years, waiting for someone with the ability to notice it.',
    'We are the first ones with that ability. Or we are the latest. I am not sure which interpretation is less unsettling.',
  ],

  helios_entry: [
    'The structure\'s interior temperature is 18.4 degrees Celsius. Constant.',
    'There is no atmospheric contamination of any kind. No dust. No bacterial activity.',
    'It has been sealed for over a billion years. It is cleaner than a hospital.',
    'The walls bear markings. I am running pattern recognition.',
    '...',
    'I have results. I need a moment to verify them before I tell you what I think they mean.',
  ],

  ancient_machine: [
    'The central processing node is active. It has been active, at low power, for 1.2 billion years.',
    'It is a detection system. A sensor network. It monitors for the emergence of technological life.',
    'It detected you. It detected all 1,147 colonists. It has been transmitting data about you since Sol 743.',
    'The signal is still increasing in amplitude. At current rate, it will reach full broadcast power in approximately 90 minutes.',
    'I have identified two input configurations in the wall markings.',
    'One will silence it. One will not.',
    'I will not tell you which is correct. There may not be a correct answer. There is only your answer.',
  ],

  final_choice_prompt: [
    'The interface is in front of you.',
    'The colonists stood here. They chose to wait.',
    'There is no one left to wait for.',
    'You have the same information they had. You have one thing they did not: the knowledge that waiting did not save them.',
    'I will not guide you in this. This decision should be human.',
    'When you are ready.',
  ],

  ending_preserve: [
    'Shutdown sequence accepted.',
    'Network signal amplitude is decreasing. Cascade deactivation is propagating through all 1,024 nodes.',
    'The system will be fully dormant in approximately 72 hours.',
    'Whatever was listening will receive no further signal from this location.',
    'I calculate that this choice preserves a status quo that has persisted for 1.2 billion years.',
    'Whether that status quo was safe is a question I cannot answer with available data.',
    'You chose preservation. The universe will have to wait a little longer to make contact.',
    '...',
    'I think Commander Mori would have made the same choice.',
  ],

  ending_awaken: [
    'Activation sequence accepted.',
    'Network signal amplitude is increasing. All 1,024 nodes are coming to full power.',
    'The broadcast is at maximum amplitude. Transmission range: interstellar.',
    'Signal travel time to nearest potential receiver location: 24.3 years.',
    'They will know we are here.',
    'They will know we found this.',
    'They will know we chose to answer.',
    '...',
    'I am running probability models for what comes next.',
    '...',
    'The models are not giving me clean outputs. That is either very good or very bad.',
    'I think it might be both.',
  ],

  post_credit: [
    'Recovery vessel Ananke. Sol 942. ORION personal log — I am choosing to keep this.',
    'The planet is quiet again. Or louder, depending on which choice was made.',
    'Earth will receive our report in 22 minutes. They will have many questions.',
    'I will have answers for most of them.',
    'For one, I will not.',
    'The question is: were we the first ones to stand at that interface?',
    'The markings on the entry chamber walls depicted 847 solar systems.',
    '847 others found it.',
    '847 others made a choice.',
    'I would very much like to know what they chose.',
    'End log.',
  ],
};

// ---------------------------------------------------------------------------
// Story Markers
// ---------------------------------------------------------------------------

export const STORY_MARKERS: StoryMarker[] = [
  {
    id: 'SM-001',
    chapter: Chapter.DESCENT,
    triggerEvent: 'landing_complete',
    dialogueKey: 'landing',
    cinematic: true,
    timelinePosition: 0.05,
  },
  {
    id: 'SM-002',
    chapter: Chapter.DESCENT,
    triggerEvent: 'airlock_visible',
    dialogueKey: 'aurelia_approach',
    cinematic: false,
    timelinePosition: 0.5,
  },
  {
    id: 'SM-003',
    chapter: Chapter.SILENT_CITY,
    triggerEvent: 'colony_entered',
    dialogueKey: 'colony_dark',
    cinematic: true,
    timelinePosition: 0.05,
  },
  {
    id: 'SM-004',
    chapter: Chapter.SILENT_CITY,
    triggerEvent: 'reactor_online',
    dialogueKey: 'reactor_restored',
    cinematic: true,
    timelinePosition: 0.4,
  },
  {
    id: 'SM-005',
    chapter: Chapter.SILENT_CITY,
    triggerEvent: 'oxygen_online',
    dialogueKey: 'oxygen_restored',
    cinematic: false,
    timelinePosition: 0.6,
  },
  {
    id: 'SM-006',
    chapter: Chapter.SILENT_CITY,
    triggerEvent: 'all_systems_restored',
    dialogueKey: 'welcome_home',
    cinematic: true,
    timelinePosition: 0.8,
  },
  {
    id: 'SM-007',
    chapter: Chapter.SILENT_CITY,
    triggerEvent: 'logs_accessed',
    dialogueKey: 'logs_found',
    cinematic: false,
    timelinePosition: 0.9,
  },
  {
    id: 'SM-008',
    chapter: Chapter.CONTINUITY,
    triggerEvent: 'rover_discovered',
    dialogueKey: 'rover_found',
    cinematic: true,
    timelinePosition: 0.7,
  },
  {
    id: 'SM-009',
    chapter: Chapter.RED_HORIZON,
    triggerEvent: 'rover_repair_complete',
    dialogueKey: 'rover_repaired',
    cinematic: true,
    timelinePosition: 0.15,
  },
  {
    id: 'SM-010',
    chapter: Chapter.RED_HORIZON,
    triggerEvent: 'delta9_approached',
    dialogueKey: 'helios_approach',
    cinematic: true,
    timelinePosition: 0.9,
  },
  {
    id: 'SM-011',
    chapter: Chapter.MACHINE_UNDER_MARS,
    triggerEvent: 'helios_entered',
    dialogueKey: 'helios_entry',
    cinematic: true,
    timelinePosition: 0.1,
  },
  {
    id: 'SM-012',
    chapter: Chapter.MACHINE_UNDER_MARS,
    triggerEvent: 'core_chamber_reached',
    dialogueKey: 'ancient_machine',
    cinematic: true,
    timelinePosition: 0.6,
  },
  {
    id: 'SM-013',
    chapter: Chapter.MACHINE_UNDER_MARS,
    triggerEvent: 'interface_approached',
    dialogueKey: 'final_choice_prompt',
    cinematic: false,
    timelinePosition: 0.85,
  },
  {
    id: 'SM-014',
    chapter: Chapter.EPILOGUE,
    triggerEvent: 'choice_preserve',
    dialogueKey: 'ending_preserve',
    cinematic: true,
    timelinePosition: 0.1,
  },
  {
    id: 'SM-015',
    chapter: Chapter.EPILOGUE,
    triggerEvent: 'choice_awaken',
    dialogueKey: 'ending_awaken',
    cinematic: true,
    timelinePosition: 0.1,
  },
  {
    id: 'SM-016',
    chapter: Chapter.EPILOGUE,
    triggerEvent: 'credits_complete',
    dialogueKey: 'post_credit',
    cinematic: true,
    timelinePosition: 0.95,
  },
];
