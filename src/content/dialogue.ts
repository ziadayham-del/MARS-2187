/**
 * dialogue.ts
 * MARS: 2187 — Dialogue system data.
 * ORION sequences: short, clinical, occasionally ominous. Max 2 sentences per line.
 * Terminal messages: diegetic text found on colony terminals.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface DialogueLine {
  speaker: string;
  text: string;
  delay: number;   // Milliseconds before the next line auto-advances (0 = wait for input)
}

export interface DialogueSequence {
  id: string;
  lines: DialogueLine[];
  trigger?: string;   // Optional event key that auto-triggers this sequence
}

// ---------------------------------------------------------------------------
// ORION Sequences
// ---------------------------------------------------------------------------

export const ORION_SEQUENCES: Record<string, DialogueSequence> = {

  // ── Game Start / Approach ─────────────────────────────────────────────────

  seq_landing: {
    id: 'seq_landing',
    trigger: 'landing_complete',
    lines: [
      { speaker: 'ORION', text: 'Touchdown confirmed. All hull sensors nominal.', delay: 3000 },
      { speaker: 'ORION', text: 'External temperature: minus 63 Celsius. Wind speed: 12 metres per second.', delay: 3500 },
      { speaker: 'ORION', text: 'I am receiving no transmissions from Aurelia Colony.', delay: 3000 },
      { speaker: 'ORION', text: 'Radio silence at this range is not a signal degradation issue. It is a choice, or an outcome.', delay: 4000 },
      { speaker: 'ORION', text: 'Suit up. The colony is 140 metres northeast.', delay: 0 },
    ],
  },

  seq_first_look: {
    id: 'seq_first_look',
    trigger: 'airlock_visible',
    lines: [
      { speaker: 'ORION', text: 'Primary airlock is intact. No visible structural damage.', delay: 3000 },
      { speaker: 'ORION', text: 'Emergency beacons are offline. Those have independent 90-day battery reserves.', delay: 3500 },
      { speaker: 'ORION', text: 'Something drained them. I am logging this.', delay: 0 },
    ],
  },

  seq_airlock_override: {
    id: 'seq_airlock_override',
    trigger: 'airlock_breached',
    lines: [
      { speaker: 'ORION', text: 'Manual override engaged. Airlock cycling.', delay: 2500 },
      { speaker: 'ORION', text: 'Interior pressure: 42 kilopascals. Oxygen partial pressure: 8.1 kPa.', delay: 3000 },
      { speaker: 'ORION', text: 'Breathable. For approximately 14 hours at your current metabolic rate.', delay: 3500 },
      { speaker: 'ORION', text: 'I recommend we find the reactor before we discuss anything else.', delay: 0 },
    ],
  },

  // ── Reactor Sequence ──────────────────────────────────────────────────────

  seq_reactor_approach: {
    id: 'seq_reactor_approach',
    trigger: 'reactor_room_entered',
    lines: [
      { speaker: 'ORION', text: 'ARC-3 fusion reactor. Shutdown state. Plasma chamber at ambient temperature.', delay: 3000 },
      { speaker: 'ORION', text: 'The shutdown sequence was executed correctly. This was not a failure.', delay: 3500 },
      { speaker: 'ORION', text: 'Restart requires three control nodes to be authorised in sequence. Safety protocol.', delay: 3000 },
      { speaker: 'ORION', text: 'I have identified the node locations. The first is on this level.', delay: 0 },
    ],
  },

  seq_node_one: {
    id: 'seq_node_one',
    trigger: 'reactor_node_1_active',
    lines: [
      { speaker: 'ORION', text: 'Node one confirmed. One of three.', delay: 2000 },
      { speaker: 'ORION', text: 'Node two is in the maintenance sublevel. Take the service stairs.', delay: 0 },
    ],
  },

  seq_node_two: {
    id: 'seq_node_two',
    trigger: 'reactor_node_2_active',
    lines: [
      { speaker: 'ORION', text: 'Node two confirmed. Two of three.', delay: 2000 },
      { speaker: 'ORION', text: 'The final node is in the reactor hall itself. The door requires a magnetic key.', delay: 3000 },
      { speaker: 'ORION', text: 'I am detecting a key-shaped magnetic signature in the adjacent tool cabinet.', delay: 0 },
    ],
  },

  seq_reactor_online: {
    id: 'seq_reactor_online',
    trigger: 'reactor_online',
    lines: [
      { speaker: 'ORION', text: 'Plasma ignition confirmed.', delay: 2000 },
      { speaker: 'ORION', text: 'ARC-3 output: 11.8 megawatts. That is 98.3% of rated capacity.', delay: 3000 },
      { speaker: 'ORION', text: 'Primary lighting is restoring. Life support is restarting.', delay: 3000 },
      { speaker: 'ORION', text: 'The colony is not dead. It was merely waiting for someone to come back.', delay: 0 },
    ],
  },

  // ── Oxygen / Life Support ─────────────────────────────────────────────────

  seq_oxygen_low: {
    id: 'seq_oxygen_low',
    trigger: 'oxygen_critical',
    lines: [
      { speaker: 'ORION', text: 'Oxygen partial pressure is below 7.5 kilopascals. Cognitive impairment threshold.', delay: 3000 },
      { speaker: 'ORION', text: 'The oxygen generation modules were manually disabled. This was deliberate.', delay: 3500 },
      { speaker: 'ORION', text: 'Find the primary module. Restore it. We can speculate about why later.', delay: 0 },
    ],
  },

  seq_oxygen_restored: {
    id: 'seq_oxygen_restored',
    trigger: 'oxygen_online',
    lines: [
      { speaker: 'ORION', text: 'Oxygen generation is at full capacity. Atmospheric reserves are refilling.', delay: 3000 },
      { speaker: 'ORION', text: 'Safe atmospheric density will be reached in approximately four hours.', delay: 3000 },
      { speaker: 'ORION', text: 'Someone turned off the air. Then left. I have been thinking about the order of those two events.', delay: 4000 },
      { speaker: 'ORION', text: 'They wanted anyone who stayed behind to have time to leave.', delay: 0 },
    ],
  },

  // ── Log Discovery ─────────────────────────────────────────────────────────

  seq_first_log: {
    id: 'seq_first_log',
    trigger: 'first_log_found',
    lines: [
      { speaker: 'ORION', text: 'Personal log accessed. This belongs to Chief Engineer Volkov.', delay: 2500 },
      { speaker: 'ORION', text: 'I will not summarise it. Read it yourself.', delay: 3000 },
      { speaker: 'ORION', text: 'Some things should not be filtered through an AI.', delay: 0 },
    ],
  },

  seq_mori_log: {
    id: 'seq_mori_log',
    trigger: 'commander_log_found',
    lines: [
      { speaker: 'ORION', text: 'Commander Mori\'s log. The final entry is dated Sol 891.', delay: 3000 },
      { speaker: 'ORION', text: 'He knew what was coming. He made a decision. The decision was to wait.', delay: 3500 },
      { speaker: 'ORION', text: 'Waiting did not save them. I do not say this as a criticism.', delay: 3000 },
      { speaker: 'ORION', text: 'I say it because you will face the same decision, and you should know what waiting costs.', delay: 0 },
    ],
  },

  // ── Signal Discovery ──────────────────────────────────────────────────────

  seq_signal_detected: {
    id: 'seq_signal_detected',
    trigger: 'signal_first_contact',
    lines: [
      { speaker: 'ORION', text: 'I am receiving a signal from beneath the colony floor.', delay: 3000 },
      { speaker: 'ORION', text: 'Frequency: 0.003 to 0.007 hertz. Below audible range.', delay: 3000 },
      { speaker: 'ORION', text: 'The frequency components correspond to a prime-number harmonic series.', delay: 3500 },
      { speaker: 'ORION', text: 'I want to be precise: the probability of this occurring naturally is less than one in ten billion.', delay: 4000 },
      { speaker: 'ORION', text: 'This is not geological. This is structured.', delay: 0 },
    ],
  },

  seq_signal_analysed: {
    id: 'seq_signal_analysed',
    trigger: 'signal_decoded',
    lines: [
      { speaker: 'ORION', text: 'Analysis complete. The signal encodes a spatial coordinate system.', delay: 3000 },
      { speaker: 'ORION', text: '1,024 points. Distributed across the Martian crust at depths between 200 metres and 40 kilometres.', delay: 4000 },
      { speaker: 'ORION', text: 'This is a network. A planetary-scale network.', delay: 3000 },
      { speaker: 'ORION', text: 'One node is 340 kilometres from our current position.', delay: 3000 },
      { speaker: 'ORION', text: 'That is where the rover went. That is where we are going.', delay: 0 },
    ],
  },

  // ── Rover ─────────────────────────────────────────────────────────────────

  seq_rover_diagnostic: {
    id: 'seq_rover_diagnostic',
    trigger: 'rover_diagnostic_run',
    lines: [
      { speaker: 'ORION', text: 'Diagnostic complete. Three systems require repair.', delay: 2500 },
      { speaker: 'ORION', text: 'Battery management controller: failed. Navigation IMU: miscalibrated. Radar array: cracked housing.', delay: 4000 },
      { speaker: 'ORION', text: 'Replacement components are in the workshop. I have marked their locations.', delay: 3000 },
      { speaker: 'ORION', text: 'Estimated repair time: two to three hours. I recommend starting with the battery controller.', delay: 0 },
    ],
  },

  // ── Helios Entry ──────────────────────────────────────────────────────────

  seq_helios_door: {
    id: 'seq_helios_door',
    trigger: 'helios_door_opened',
    lines: [
      { speaker: 'ORION', text: 'The door opened when you approached it. No mechanical input. No power source I can detect.', delay: 3500 },
      { speaker: 'ORION', text: 'Interior temperature: 18.4 degrees Celsius. Atmospheric composition: identical to Earth standard.', delay: 4000 },
      { speaker: 'ORION', text: 'It has been sealed for 1.2 billion years.', delay: 3000 },
      { speaker: 'ORION', text: 'It is cleaner than the recovery vessel we arrived in.', delay: 0 },
    ],
  },

  seq_wall_markings: {
    id: 'seq_wall_markings',
    trigger: 'markings_analysed',
    lines: [
      { speaker: 'ORION', text: 'Pattern recognition complete. The markings are a structured information system.', delay: 3500 },
      { speaker: 'ORION', text: 'They describe solar systems. 847 of them. Each with an identical structure at the same relative depth.', delay: 4000 },
      { speaker: 'ORION', text: 'This is not a first contact site.', delay: 2500 },
      { speaker: 'ORION', text: 'This is a waypoint. They have done this 847 times before.', delay: 0 },
    ],
  },

  seq_core_chamber: {
    id: 'seq_core_chamber',
    trigger: 'core_chamber_reached',
    lines: [
      { speaker: 'ORION', text: 'Core chamber. 60 metres in diameter.', delay: 2500 },
      { speaker: 'ORION', text: 'The central structure is the primary processing node. It is active. It has been active for 1.2 billion years.', delay: 4000 },
      { speaker: 'ORION', text: 'It monitors for technological life. It detected Aurelia Colony on Sol 743.', delay: 3500 },
      { speaker: 'ORION', text: 'It has been transmitting data about the colonists ever since. It is transmitting data about you now.', delay: 4000 },
      { speaker: 'ORION', text: 'I have identified two input configurations on the interface. I will not tell you which to choose.', delay: 0 },
    ],
  },

  // ── Final Choice ──────────────────────────────────────────────────────────

  seq_choice_moment: {
    id: 'seq_choice_moment',
    trigger: 'interface_approached',
    lines: [
      { speaker: 'ORION', text: 'The interface is in front of you. The colonists stood here.', delay: 3000 },
      { speaker: 'ORION', text: 'They chose to wait for Earth\'s guidance. Earth did not respond in time.', delay: 3500 },
      { speaker: 'ORION', text: 'The decision is yours. I will implement whatever you choose without qualification.', delay: 3500 },
      { speaker: 'ORION', text: 'Take whatever time you need. The signal reaches broadcast amplitude in 90 minutes.', delay: 0 },
    ],
  },

  seq_preserve_chosen: {
    id: 'seq_preserve_chosen',
    trigger: 'choice_preserve',
    lines: [
      { speaker: 'ORION', text: 'Shutdown sequence initiated. Cascade deactivation propagating.', delay: 3000 },
      { speaker: 'ORION', text: 'Signal amplitude is decreasing. All 1,024 nodes entering dormancy.', delay: 3500 },
      { speaker: 'ORION', text: 'Full dormancy will be achieved in 72 hours.', delay: 3000 },
      { speaker: 'ORION', text: 'Whatever was listening will receive no further signal from this location.', delay: 3500 },
      { speaker: 'ORION', text: 'You chose to wait. Like Mori. Perhaps that is the right answer. We will not know.', delay: 0 },
    ],
  },

  seq_awaken_chosen: {
    id: 'seq_awaken_chosen',
    trigger: 'choice_awaken',
    lines: [
      { speaker: 'ORION', text: 'Activation sequence confirmed. All 1,024 nodes coming to full power.', delay: 3000 },
      { speaker: 'ORION', text: 'Broadcast amplitude achieved. Signal is transmitting at interstellar range.', delay: 3500 },
      { speaker: 'ORION', text: 'Nearest potential receiver: 24.3 light-years distant.', delay: 3000 },
      { speaker: 'ORION', text: 'They will know we are here in 24.3 years.', delay: 3000 },
      { speaker: 'ORION', text: 'I am running probability models for what comes after that.', delay: 3000 },
      { speaker: 'ORION', text: 'The outputs are not clean. That is either very good or very bad.', delay: 0 },
    ],
  },

};

// ---------------------------------------------------------------------------
// Terminal Messages
// ---------------------------------------------------------------------------

export const TERMINAL_MESSAGES: Record<string, string[]> = {

  // ── Engineering Logs ──────────────────────────────────────────────────────

  eng_maintenance_log: [
    'AURELIA COLONY — ENGINEERING MAINTENANCE LOG',
    'Logged by: Chief Engineer D. Volkov',
    '─────────────────────────────────────────────',
    'Sol 850 — Routine inspection of B3 foundation piles. All within structural tolerances. Vibration sensors in sector 7-B are showing anomalous low-frequency readings. Scheduled re-calibration.',
    'Sol 858 — Re-calibration of 7-B sensors completed. Readings unchanged. The sensors are not malfunctioning.',
    'Sol 863 — Cross-referenced B3 vibration data with geological survey archive. No match found. Escalated to science team.',
    'Sol 871 — Second seismic station at colony perimeter confirmed identical frequency signature. Triangulation in progress.',
    'Sol 876 — Submitted formal request to suspend Sector Zeta construction. Request denied. Continue monitoring.',
    'Sol 882 — [ENTRY REDACTED — ADMINISTRATOR\'S ORDER]',
    'Sol 890 — Continuity Protocol authorised. Beginning installation preparations.',
  ],

  eng_atmos_diagnostics: [
    'ATMOSPHERIC SYSTEM DIAGNOSTIC REPORT',
    'Generated: Sol 885 | System: Life Support AI v4.2',
    '─────────────────────────────────────────────',
    'O2 Generation — Module Alpha: OPTIMAL (22.1 kg/sol)',
    'O2 Generation — Module Beta: OPTIMAL (21.8 kg/sol)',
    'CO2 Scrubbing — Primary: OPTIMAL',
    'CO2 Scrubbing — Backup: STANDBY',
    'N2 Reserve Level: 74.3% [WARNING: Next resupply not scheduled]',
    'Atmospheric Pressure: 70.1 kPa [NOMINAL]',
    'Trace Gas Analysis: Within safe parameters',
    'Recommendation: Schedule N2 resupply. Current reserves support 310 sol operating window.',
    '─────────────────────────────────────────────',
    'NOTE: Manual override access to oxygen generation modules has been logged 1 time in this period. Override by: Commander T. Mori [Sol 891, 03:44]',
  ],

  eng_water_report: [
    'WATER EXTRACTION AND PROCESSING — WEEKLY SUMMARY',
    'Period: Sol 880–886 | Compiled by: Automated System',
    '─────────────────────────────────────────────',
    'Total extraction: 196,400 litres (28,057 litres/sol avg)',
    'Perchlorate concentration post-treatment: 0.0003 mg/L [SAFE]',
    'Primary cistern level: 87.4% (78,660 litres)',
    'Secondary cistern level: 91.2% (82,080 litres)',
    'Combined reserve: 90.3 sol supply at current consumption rate',
    'Probe efficiency: 23/24 probes operational [Probe 17 heating element failure — replacement scheduled Sol 888]',
    '─────────────────────────────────────────────',
    'SYSTEM STATUS: NOMINAL. Water supply presents no operational concern.',
  ],

  eng_rover_maintenance: [
    'M-7 FLEET MAINTENANCE RECORD — UNIT M-7-02 "PERSISTENCE"',
    '─────────────────────────────────────────────',
    'Sol 836 — Scheduled 500-sol service completed. All systems within tolerance.',
    'Sol 854 — Navigation IMU recalibration. Minor drift corrected.',
    'Sol 866 — Deployed for Zone Delta-9 survey mission. Crew: Ramos, Chen, Dr. Osei.',
    'Sol 870 — Mission complete. Return confirmed. Post-mission maintenance initiated.',
    'Sol 870 — [MAINTENANCE LOG INCOMPLETE — NO FURTHER ENTRIES]',
    '─────────────────────────────────────────────',
    'NOTE: M-7-02 was returned to garage bay in non-operational state following Sol 866 mission. Responsible technician: Unknown. Status at time of colony abandonment: DAMAGED, UNREPAIRED.',
  ],

  // ── System Diagnostics ────────────────────────────────────────────────────

  sys_reactor_status: [
    'ARC-3 FUSION REACTOR — SYSTEM STATUS REPORT',
    'Last updated: Sol 891 | Time: 23:51',
    '─────────────────────────────────────────────',
    'Plasma status: SHUTDOWN (controlled)',
    'Shutdown initiator: Automated safety protocol — trigger code 7-ALPHA',
    'Trigger condition: Seismic amplitude threshold exceeded in monitoring zone B3',
    'Coolant temperature: 18.3°C (ambient)',
    'Helium-3 fuel reserve: 94.7%',
    'Deuterium reserve: 88.2%',
    'Estimated time to restart eligibility: 0 hours (all safety conditions met)',
    '─────────────────────────────────────────────',
    'Restart requires manual authorisation at three independent control nodes.',
    'CAUTION: If seismic event is ongoing, assess structural integrity before restart.',
  ],

  sys_comms_log: [
    'COMMUNICATIONS LOG — INCOMING TRANSMISSIONS',
    'Aurelia Colony Station ID: AUR-2187-ALPHA',
    '─────────────────────────────────────────────',
    '[Sol 880] ISA Routine administrative packet. Received and acknowledged.',
    '[Sol 892] ISA Status query. NOT ACKNOWLEDGED — UPLINK OFFLINE.',
    '[Sol 895] ISA Status query. NOT ACKNOWLEDGED — UPLINK OFFLINE.',
    '[Sol 899] ISA Formal welfare check — PRIORITY ALPHA. NOT ACKNOWLEDGED.',
    '[Sol 906] ISA Formal welfare check — PRIORITY ALPHA. NOT ACKNOWLEDGED.',
    '[Sol 910] ISA EMERGENCY ESCALATION — Recovery vessel dispatch authorised. NOT ACKNOWLEDGED.',
    '─────────────────────────────────────────────',
    'UPLINK STATUS: CONTROL CABLE DISCONNECTED',
    'Dish structural status: INTACT and operational',
    'Time since last acknowledged transmission: 12 sols',
  ],

  sys_network_alert: [
    'COLONY NETWORK SECURITY ALERT',
    'Alert generated: Sol 891 | Time: 22:03',
    'Classification: LEVEL 5 — COMMAND AUTHORITY',
    '─────────────────────────────────────────────',
    'Unusual data access pattern detected on core data bus.',
    'Large-volume read operation from: SCIENCE WING DATA PARTITION',
    'Destination: CONTINUITY ARCHIVE MODULE (encrypted)',
    'Authorising account: Commander T. Mori (ISA-ALPHA-7 clearance)',
    'Volume transferred: 4.7 terabytes',
    'Operation status: COMPLETE',
    '─────────────────────────────────────────────',
    'This alert is for audit purposes. No action required.',
    'Continuity Protocol operation authorised under ISA Strategic Directive 7-DELTA.',
  ],

  // ── Evacuation Notices ────────────────────────────────────────────────────

  evac_broadcast_transcript: [
    'EMERGENCY BROADCAST — TRANSCRIPT',
    'Transmitted: Sol 892 | Time: 03:22 | Duration: 47 seconds',
    '─────────────────────────────────────────────',
    '"All personnel, this is Administrator Brenner. This is an emergency evacuation notice."',
    '"All non-essential personnel are to report immediately to Docking Bay 7 for departure."',
    '"Bring personal medical supplies. Leave non-essential equipment."',
    '"This is not a drill. I repeat, this is not a drill."',
    '"Essential crew will follow departure protocol Omega-3. Report to your designated stations."',
    '"You have thirty minutes."',
    '─────────────────────────────────────────────',
    'SYSTEM NOTE: No authorisation code logged for this broadcast. Source authentication: UNVERIFIED.',
    'SYSTEM NOTE: Broadcast voice print matched to Administrator Y. Brenner with 94.7% confidence.',
  ],

  evac_manifest_partial: [
    'EVACUATION MANIFEST — PARTIAL RECOVERY',
    'Vessels: Ascent Vehicle 1 (departed Sol 892, 03:58) and Ascent Vehicle 2 (departed Sol 892, 04:34)',
    '─────────────────────────────────────────────',
    'WARNING: Manifest data partially corrupted. Recovered entries: 683 of estimated 680-720 passengers.',
    '─────────────────────────────────────────────',
    'Ascent Vehicle 1 — Estimated departure capacity: 340 persons',
    'Ascent Vehicle 2 — Estimated departure capacity: 340 persons',
    'Ascent Vehicle 3 — Launch attempted Sol 892 04:51 — ABORTED MID-SEQUENCE — Vehicle in Bay 3',
    'Ascent Vehicle 4 — No launch command recorded — Vehicle in Bay 4 — FUEL RESERVES: 100%',
    '─────────────────────────────────────────────',
    'Estimated population not aboard departing vehicles: ~460 persons',
    'Current colony population confirmed by sensor sweep: 0 living persons detected.',
  ],

  // ── Research Notes ────────────────────────────────────────────────────────

  sci_biology_notes: [
    'XENOBIOLOGY RESEARCH NOTES — DR. P. MEHTA',
    'Status: DRAFT — NOT FOR DISTRIBUTION',
    '─────────────────────────────────────────────',
    'Sample ID AUR-DS3-340M-07 contains lipid membrane structures inconsistent with abiotic origin.',
    'Amino acid chirality distribution: L/D ratio 18:1. Abiotic baseline: 1:1. Biological Mars fossils predicted: 10:1 to 20:1.',
    'Result is consistent with biological origin. Independent verification by Chen and Osei (blind study): CONFIRMED.',
    '─────────────────────────────────────────────',
    'Sample ID AUR-DS3-340M-12 — ALERT: Fluorescence assay returned positive read for metabolic activity markers.',
    'This is NOT a fossil sample. The structures are intact.',
    'Implication: Living or dormant microorganisms at 340 metre depth.',
    'THIS RESULT HAS NOT BEEN REPORTED TO ISA. Awaiting Commander Mori\'s authorisation.',
    '─────────────────────────────────────────────',
    '"The life that was here is not the life we are finding now." — P.M., Sol 888',
  ],

  sci_geology_survey: [
    'HELLAS PLANITIA GEOLOGICAL SURVEY — SUMMARY',
    'Principal Investigator: Dr. K. Osei | Sol 800 compilation',
    '─────────────────────────────────────────────',
    'Core samples retrieved from 3 drill sites. Maximum depth: 340 metres.',
    'Layers 4–5 (est. 3.4–3.5 Ga): Carbonate and phyllosilicate mineralogy. Neutral-pH liquid water environment sustained for >10,000 years.',
    'Biological potential: HIGH. Consistent with early Mars habitability window.',
    '─────────────────────────────────────────────',
    'Layer 2 (est. 1.2 Ga) — ANOMALOUS RESULT:',
    'Elemental composition: Titanium (62.3%), Tungsten (31.1%), Unknown-Z (6.6%)',
    'Unknown-Z does not match any element in ISA spectral library.',
    'Material is artificially pure. No geological mechanism produces this concentration or purity.',
    'Material is distributed uniformly at this stratigraphic layer in ALL three drill sites.',
    'Classification: CANNOT BE CLASSIFIED BY AVAILABLE ANALYTICAL METHODS.',
    '─────────────────────────────────────────────',
    'This result has been logged and flagged for ISA review. Anticipate extended response time.',
  ],

  sci_signal_analysis: [
    'SIGNAL ANALYSIS REPORT — ANOMALOUS SUBSURFACE SIGNAL',
    'Authors: Dr. P. Mehta, Dr. K. Osei, Systems Analyst J. Park',
    'Classification: RESTRICTED — COMMAND EYES ONLY',
    '─────────────────────────────────────────────',
    'Signal origin: Triangulated to 400m depth, directly below Sector Zeta.',
    'Frequency range: 0.003–0.007 Hz (infrasound, below human perception threshold)',
    'Fourier decomposition: 847 discrete frequency components identified.',
    'Component ratio pattern: MATCHES Farey sequence (first 847 terms) to within measurement error.',
    '─────────────────────────────────────────────',
    'Secondary analysis — Phase relationships encode spatial coordinate data.',
    '1,024 coordinate points identified. Distribution: Martian crust, 200m–40km depth.',
    'Pattern consistency: GEODETICALLY REGULAR. Interpretation: Planetary-scale artificial network.',
    '─────────────────────────────────────────────',
    'Signal amplitude: INCREASING. Growth model: EXPONENTIAL.',
    'Extrapolated broadcast-amplitude date: Sol 892 (±2 sol uncertainty).',
    'RECOMMENDATION: Immediate ISA escalation. Commander Mori has been briefed.',
  ],

  sci_magnetometer_data: [
    'MAGNETOMETER ARRAY — ANOMALY REPORT',
    'Generated: Sol 799 | Automated alert system',
    '─────────────────────────────────────────────',
    'Anomalous magnetic field activity detected at sensor cluster 7-B.',
    'Field strength: 2,340 nanoteslas (local baseline: 43 nanoteslas)',
    'Anomaly depth estimate: 380–420 metres',
    'Field behaviour: PULSED — period 334 seconds',
    '─────────────────────────────────────────────',
    'Cross-reference: Perimeter sensor cluster 12-F confirms identical period pulsing.',
    'Spatial correlation: Both anomalies originate from same subsurface point.',
    'Geological classification: NO MATCH IN DATABASE.',
    '─────────────────────────────────────────────',
    'SYSTEM NOTE: Pulsed magnetic anomalies with this regularity are not produced by any known geological mechanism. Flagging for human review.',
  ],

  // ── Personal Terminal Notes ───────────────────────────────────────────────

  personal_brenner: [
    'ADMINISTRATOR Y. BRENNER — PERSONAL NOTES',
    '[Password-protected — override applied]',
    '─────────────────────────────────────────────',
    'Sol 878 — Volkov showed me the spectrograms. I said what I had to say. I know what I saw.',
    'Sol 883 — Mori told me about B3. The door. I have not slept.',
    'Sol 886 — ISA inspection is in 40 sols. If I report this now, they will shut us down. 1,147 people live here. I need more time.',
    'Sol 890 — Mori is invoking Continuity Protocol. He is right. I was wrong to delay. I am sorry.',
    'Sol 891 — The signal is at 94% of broadcast amplitude. We can\'t wait for Earth to respond. I am initiating evacuation at 03:00.',
    'Sol 891, late — I will be on the last vehicle. Or I will not leave. I haven\'t decided.',
    '─────────────────────────────────────────────',
    '[No further entries]',
  ],

  personal_ramos: [
    'SECURITY OFFICER F. RAMOS — DUTY LOG',
    '─────────────────────────────────────────────',
    'Sol 866 — Zone Delta-9 survey complete. What we found at that site... I am a security officer. I deal with people problems. I don\'t have words for a problem this size.',
    'Sol 867 — Briefed Commander Mori in full. He was very quiet for a long time. Then he said thank you.',
    'Sol 890 — Assigned to Continuity Protocol installation team. Volkov leading. Mori and Mehta also attending.',
    'Sol 891, 23:47 — Installation complete. We are not returning to the colony interior. Mori\'s orders.',
    'Sol 892, 00:15 — We are in the B3 crawlspace. Below us, the door is still open. Something is moving in the passage beyond it.',
    'Sol 892, 00:23 — Sealing the hatch from this side. We are going up.',
    '─────────────────────────────────────────────',
    '[No further entries]',
  ],

};
