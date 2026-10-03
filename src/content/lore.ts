/**
 * lore.ts
 * MARS: 2187 — Complete lore database.
 * All entries are organised by category and include rich, scientifically
 * grounded narrative text for the Aurelia Colony setting.
 */

// ---------------------------------------------------------------------------
// Enums & Interfaces
// ---------------------------------------------------------------------------

export enum LoreCategory {
  COLONY     = 'COLONY',
  ENGINEERING = 'ENGINEERING',
  SCIENCE    = 'SCIENCE',
  PERSONNEL  = 'PERSONNEL',
  ANOMALY    = 'ANOMALY',
  HELIOS     = 'HELIOS',
}

export interface LoreEntry {
  id: string;
  category: LoreCategory;
  title: string;
  content: string[];   // Array of paragraphs (2–4 per entry)
  discovered: boolean;
  location: string;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export const LORE_DATABASE: LoreEntry[] = [
  // ── COLONY ────────────────────────────────────────────────────────────────

  {
    id: 'COL-001',
    category: LoreCategory.COLONY,
    title: 'The Founding of Aurelia',
    discovered: false,
    location: 'Colony Entrance Hall — Memorial Plaque',
    content: [
      'Aurelia Colony was established in 2171 by the Interplanetary Settlement Authority (ISA), ' +
      'following a decade of precursor robotic missions that pre-positioned seventeen thousand tonnes ' +
      'of structural components in the Hellas Planitia basin. The site was chosen for its anomalously ' +
      'high subsurface water-ice concentration, its relatively sheltered topography, and an average ' +
      'surface elevation three kilometres below the Martian datum — giving colonists a modest but ' +
      'measurable reduction in cosmic-ray flux.',

      'Construction proceeded in four phases spanning eighteen months. Phase one deployed inflatable ' +
      'habitat rings pressure-tested to 200 kPa; phase two installed the regolith-sintered outer shell ' +
      'capable of withstanding 900 km/h dust-devil winds; phase three connected life-support and power ' +
      'infrastructure; phase four commissioned the central atrium and research wings. At peak build, ' +
      'four hundred construction workers and thirty-two autonomous fabrication crawlers operated ' +
      'simultaneously across the construction footprint.',

      'Aurelia was designed for a steady-state population of 1,200 residents, with surge capacity ' +
      'for 1,800. At the time of the ISA\'s last census — filed 14 months before the silence — the ' +
      'colony housed 1,147 men and women. The youngest resident was eleven weeks old. Her name was ' +
      'Vera Cassia Okonkwo. She was born on Mars.',
    ],
  },

  {
    id: 'COL-002',
    category: LoreCategory.COLONY,
    title: 'Sector Layout and Infrastructure',
    discovered: false,
    location: 'Colony Control Center — Facility Map',
    content: [
      'Aurelia is organised into six sectors radiating from a central hub designated the Atrium. ' +
      'Sectors Alpha through Delta house residential quarters, medical, education, and communal ' +
      'facilities. Sector Epsilon houses the primary engineering and manufacturing complex. Sector ' +
      'Zeta, constructed last and still partially incomplete at the time of the crisis, was intended ' +
      'to serve as the colony\'s agricultural expansion wing.',

      'All sectors are connected via the Ring Corridor — a pressurised tube three metres in diameter ' +
      'and 2.4 kilometres in total circumference. Emergency blast doors, rated to withstand 50 kPa ' +
      'pressure differentials, subdivide the Ring into sixteen segments. Automated sensor clusters ' +
      'monitor atmospheric composition, radiation levels, and structural integrity at 30-second ' +
      'intervals and log all readings to the colony\'s central data core.',

      'Below the primary floor level lie three sub-levels: B1 for utility conduits and cable runs, ' +
      'B2 for water reclamation and waste processing, and B3, which serves as the foundation ' +
      'anchorage for the colony\'s main structural piles. B3 was never fully mapped or surveyed by ' +
      'colonists. Seismic sensors installed in B3 began returning irregular readings approximately ' +
      'nine months before the colony went dark.',
    ],
  },

  {
    id: 'COL-003',
    category: LoreCategory.COLONY,
    title: 'Evacuation Records — Final Hours',
    discovered: false,
    location: 'Sector Alpha — Emergency Operations Room',
    content: [
      'At 03:22 colony standard time on Sol 892, the colony\'s emergency broadcast system activated ' +
      'without a recorded authorisation code. The broadcast ordered all non-essential personnel to ' +
      'assemble at docking bay seven for immediate evacuation. The voice on the broadcast belonged ' +
      'to Chief Administrator Yael Brenner. No record of Brenner initiating the broadcast exists in ' +
      'the system logs.',

      'Flight manifest data recovered from the docking bay terminals shows that two of the colony\'s ' +
      'four ascent vehicles departed within forty minutes of the broadcast. Passenger logs were ' +
      'partially corrupted, but approximately 680 names were identified. A third vehicle attempted ' +
      'launch at 04:51 but was aborted mid-sequence. The fourth vehicle never received a launch ' +
      'command. It remains in its bay, fully fuelled.',

      'Of the 1,147 residents, an estimated 460 did not board either departing vehicle. Whether they ' +
      'chose to remain, were prevented from reaching the docking bay, or were already incapacitated ' +
      'by the time the broadcast sounded is unknown. The colony\'s medical wing shows signs of ' +
      'occupied beds. The cafeteria shows signs of an interrupted meal. Sector Zeta\'s emergency ' +
      'lockers were opened, and the emergency suits are gone.',
    ],
  },

  {
    id: 'COL-004',
    category: LoreCategory.COLONY,
    title: 'The Atrium — Cultural Heart of Aurelia',
    discovered: false,
    location: 'Atrium — Central Hub',
    content: [
      'Aurelia\'s Atrium was more than a transit node. Spanning forty metres in diameter with a ' +
      'vaulted transparent-alumina dome that offered an unobstructed view of the Martian sky, it was ' +
      'intentionally designed to anchor the psychological wellbeing of colonists who would go weeks ' +
      'without seeing natural light through any other window.',

      'The Atrium housed a hydroponic garden — 340 square metres of Earth flora maintained by ' +
      'Dr. Amara Solis\'s botanical team. Cherry tomatoes, basil, dwarf wheat, and a single olive ' +
      'tree transplanted from a cutting donated by the Greek government grew under full-spectrum LED ' +
      'arrays calibrated to mimic Mediterranean afternoon sunlight. The olive tree was eight years ' +
      'old and had never borne fruit. Colonists called it the Stubborn One.',

      'When the colony fell silent, the Atrium\'s automated irrigation systems continued to run for ' +
      'approximately eleven days before a power fault cascaded through the lighting grid. Without ' +
      'light, the garden died over a period of weeks. The olive tree was the last to go.',
    ],
  },

  // ── ENGINEERING ───────────────────────────────────────────────────────────

  {
    id: 'ENG-001',
    category: LoreCategory.ENGINEERING,
    title: 'Subsurface Water Extraction Systems',
    discovered: false,
    location: 'Engineering Wing — Water Processing Bay',
    content: [
      'Aurelia\'s primary water supply derives from a network of twenty-four heated bore probes ' +
      'sunk to depths between 80 and 140 metres, where ground-penetrating radar surveys confirmed ' +
      'high-purity water-ice mixed with regolith at concentrations averaging 34% by volume. Each ' +
      'probe uses a resistive heating element rated to 3.2 kW to melt ice in situ, drawing the ' +
      'resulting liquid upward via peristaltic pump to surface collection tanks.',

      'Extracted water passes through a six-stage purification train: first a coarse particulate ' +
      'filter removes regolith fines, then an ion-exchange column strips perchlorates and heavy ' +
      'metals, then UV sterilisation, then reverse osmosis, then remineralisation to restore a ' +
      'physiologically appropriate mineral profile, and finally a final UV pass before storage. ' +
      'Perchlorate removal is critical; Martian regolith contains between 0.5 and 1.0 g/kg ' +
      'perchlorate salts, far above safe drinking thresholds.',

      'At peak colony demand, the extraction network produced 28,000 litres per sol — enough to ' +
      'supply drinking, cooking, sanitation, and hydroponics. Emergency reserves stored in two ' +
      'insulated underground cisterns held a 90-sol supply. Those cisterns remain sealed and intact. ' +
      'Water is not the problem.',
    ],
  },

  {
    id: 'ENG-002',
    category: LoreCategory.ENGINEERING,
    title: 'Atmospheric Processing Architecture',
    discovered: false,
    location: 'Engineering Wing — Atmos Control Panel',
    content: [
      'Mars\'s thin carbon-dioxide atmosphere — mean surface pressure 600 Pa, compared to Earth\'s ' +
      '101,325 Pa — is both a resource and a hazard. Aurelia\'s atmospheric processors exploit it as ' +
      'a raw feedstock. The colony\'s six MOXIE-derivative electrolysis units strip oxygen from CO₂ ' +
      'at a combined rate of 22 kg per sol, sufficient to replace atmospheric losses from airlock ' +
      'cycling and metabolic consumption by the full resident population.',

      'A parallel Sabatier subsystem combines extracted CO₂ with hydrogen produced by water ' +
      'electrolysis to synthesise methane, which is stored in cryogenic tanks and used as ' +
      'propellant for the colony\'s ground vehicles and as an emergency thermal fuel. The ' +
      'Sabatier process is thermodynamically attractive on Mars precisely because the CO₂ feedstock ' +
      'is free and abundant.',

      'Interior atmospheric management targets 21% O₂, 78% N₂, 1% Ar at 70 kPa total pressure — ' +
      'a deliberately sub-Earth pressure that reduces structural load on the habitat shells while ' +
      'remaining physiologically safe for acclimated colonists. Nitrogen is the most logistically ' +
      'challenging element of the atmospheric budget; it must be imported from Earth or extracted ' +
      'from trace amounts in the Martian atmosphere at significant energy cost. The colony\'s last ' +
      'nitrogen resupply arrived fourteen months before the silence.',
    ],
  },

  {
    id: 'ENG-003',
    category: LoreCategory.ENGINEERING,
    title: 'M-7 Rover Development Program',
    discovered: false,
    location: 'Garage Bay — Vehicle Maintenance Log',
    content: [
      'The M-7 Ares-class pressurised rover represents the seventh generation of crewed Mars surface ' +
      'vehicles and the first to be substantially designed and manufactured on Mars rather than on ' +
      'Earth. Aurelia\'s engineering team, led by Systems Architect Daria Volkov, produced three M-7 ' +
      'units between 2174 and 2176 using the colony\'s metal-sintering fabricators and a library of ' +
      'CAD blueprints uplinked from the ISA Technical Division.',

      'The M-7 chassis is a six-wheel independent suspension design with active roll compensation. ' +
      'The pressurised crew compartment seats four in EMU-compatible harnesses and maintains an ' +
      'independent 72-hour atmospheric supply. Drive power is provided by a 180 kWh lithium-sulphur ' +
      'battery pack rated for approximately 600 km per charge under nominal load, with a methane ' +
      'fuel-cell range extender that can contribute an additional 400 km. Navigation combines ' +
      'inertial measurement, lidar terrain mapping, and uplink to the colony\'s two orbital relay ' +
      'satellites.',

      'Unit M-7-02, designated "Persistence", was the vehicle used for the critical survey of ' +
      'Anomaly Zone Delta-9 six weeks before the colony went silent. Post-mission maintenance logs ' +
      'are incomplete. Unit M-7-02 remains in the garage bay in an unspecified state of repair. ' +
      'Units M-7-01 and M-7-03 were used as evacuation support vehicles and their current locations ' +
      'are unknown.',
    ],
  },

  {
    id: 'ENG-004',
    category: LoreCategory.ENGINEERING,
    title: 'Fusion Reactor — Power Architecture',
    discovered: false,
    location: 'Reactor Hall — Engineering Sublevel',
    content: [
      'Aurelia\'s primary power supply is a compact deuterium-helium-3 tokamak fusion reactor, ' +
      'designated ARC-3, installed during Phase 3 of the colony\'s construction. At rated output ' +
      'of 12 MW electrical, ARC-3 supplies all colony systems with roughly three times the margin ' +
      'needed for normal operations. This surplus was intentional — the ISA\'s Life Safety Standards ' +
      'mandate power redundancy in the event that one or more major loads spike simultaneously.',

      'ARC-3\'s helium-3 fuel is extracted from Martian regolith using a proprietary sputtering ' +
      'process developed by Solaris Energy in 2168. While Martian He-3 concentrations are lower than ' +
      'lunar deposits, the quantities required for a 12 MW plant are modest enough that a single ' +
      'extraction campaign every 18 months provides an adequate fuel reserve. Deuterium is produced ' +
      'on-site by electrolytic separation from extracted water.',

      'The reactor is designed for fully automated operation and can sustain plasma without human ' +
      'supervision for periods of up to 90 days. However, the colony\'s reactor entered a safe ' +
      'shutdown state at some point during the crisis — the shutdown sequence was correctly executed, ' +
      'suggesting either human intervention or a software safety trigger. Restart requires manual ' +
      'verification at three independent control nodes before the plasma initiation sequence will ' +
      'engage.',
    ],
  },

  {
    id: 'ENG-005',
    category: LoreCategory.ENGINEERING,
    title: 'Communications Infrastructure',
    discovered: false,
    location: 'Communications Tower — Roof Level',
    content: [
      'Aurelia\'s external communications relied on three complementary systems: a high-gain ' +
      'parabolic dish for direct Earth uplink (subject to the 3–22 minute one-way light-time delay), ' +
      'two low-orbit relay satellites for near-real-time surface-to-surface communication across the ' +
      'planet, and a short-range UHF mesh network linking the colony to its outlying sensor arrays ' +
      'and surface vehicles.',

      'The last Earth communication received by Aurelia was a routine administrative packet ' +
      'timestamped 12 sols before the colony went dark. Earth\'s subsequent transmissions — including ' +
      'five status queries and two formal welfare checks — received no response. ISA Mission Control ' +
      'classified Aurelia as "communications-degraded" at day 14 of silence, and as "non-responsive" ' +
      'at day 30. The decision to dispatch the recovery vessel carrying ORION was made at day 45.',

      'Post-event analysis suggests the communication failure was caused by a deliberate or ' +
      'accidental severing of the main uplink dish\'s control cable, not a hardware failure in the ' +
      'dish itself. The dish remains structurally intact and pointed at Earth. The colony\'s internal ' +
      'communications network is also offline, consistent with a power interruption to the central ' +
      'data routing hub rather than distributed network failure.',
    ],
  },

  // ── SCIENCE ───────────────────────────────────────────────────────────────

  {
    id: 'SCI-001',
    category: LoreCategory.SCIENCE,
    title: 'Martian Biology — The Search for Life',
    discovered: false,
    location: 'Science Wing — Laboratory A',
    content: [
      'For two centuries before Aurelia\'s founding, the question of whether Mars harboured or had ' +
      'ever harboured life was one of science\'s most contested open problems. Early rover missions ' +
      'detected organic compounds, seasonal methane fluctuations, and clay minerals formed in ' +
      'neutral-pH liquid water — tantalising but inconclusive. Aurelia\'s science team, under Chief ' +
      'Xenobiologist Dr. Priya Mehta, was given a formal research mandate to resolve the question.',

      'By Sol 600, the team had drilled to 340 metres in three locations and analysed core samples ' +
      'using mass spectrometry, fluorescence microscopy, and RNA-sequencing protocols adapted to ' +
      'detect non-Earth-standard nucleic acid analogues. They found lipid membrane fragments ' +
      'consistent with cellular origin, amino acid chirality distributions inconsistent with purely ' +
      'abiotic chemistry, and, in one sample from the deepest drill site, structures that Mehta\'s ' +
      'team described in internal reports as "morphologically indistinguishable from fossilised ' +
      'prokaryotes."',

      'The team was preparing a formal publication when the anomaly in Zone Delta-9 was detected. ' +
      'Dr. Mehta\'s published conclusion — if it was ever written — does not exist in the accessible ' +
      'data archive. What remains are 4,200 raw data files, three partial draft manuscripts, and a ' +
      'handwritten note pinned to her lab bench that reads: "The life that was here is not the life ' +
      'we are finding now."',
    ],
  },

  {
    id: 'SCI-002',
    category: LoreCategory.SCIENCE,
    title: 'Martian Magnetosphere and Radiation Environment',
    discovered: false,
    location: 'Science Wing — Observatory',
    content: [
      'Mars lost its global magnetic field approximately 4.1 billion years ago when its liquid outer ' +
      'core solidified, ending the dynamo effect that generates planetary-scale magnetospheres. ' +
      'Without this protective shield, Mars\'s surface receives a galactic cosmic ray flux ' +
      'approximately 50 times higher than Earth\'s surface and is subject to intense solar energetic ' +
      'particle events during solar maximum. Aurelia\'s colonists received an average effective dose ' +
      'of approximately 300 millisieverts per year on the surface in EVA suits.',

      'The colony\'s interior, shielded by the sintered-regolith outer shell and supplementary ' +
      'hydrogen-rich polyethylene radiation shielding, reduced interior doses to approximately ' +
      '80 mSv/year — still above Earth norms, but within the ISA\'s colonist exposure limits. ' +
      'Long-term colonists underwent quarterly bone-marrow screening and maintained elevated ' +
      'antioxidant supplement protocols.',

      'One unexplained observation logged by the science team: beginning approximately 14 months ' +
      'before the silence, the colony\'s magnetometer arrays began detecting localised magnetic ' +
      'field anomalies directly beneath the Sector Zeta construction site. The anomalies did not ' +
      'behave like any known geological magnetic structure. They pulsed. The pulses were periodic.',
    ],
  },

  {
    id: 'SCI-003',
    category: LoreCategory.SCIENCE,
    title: 'Geological Survey — Hellas Planitia Formation',
    discovered: false,
    location: 'Science Wing — Geology Cabinet',
    content: [
      'Hellas Planitia, where Aurelia Colony is situated, is the largest confirmed impact basin in ' +
      'the solar system, approximately 2,300 kilometres in diameter and 7 kilometres deep relative ' +
      'to the mean Martian surface. The impact that created it, estimated at 3.99 billion years ago, ' +
      'was of sufficient magnitude to melt the crust across the basin floor to a depth of several ' +
      'kilometres and generate a temporary global thermal event.',

      'Aurelia\'s geological survey teams identified seventeen distinct geological layers in cores ' +
      'extracted from the basin floor, recording a continuous 3.8-billion-year stratigraphic ' +
      'sequence. Of particular interest were layers 4 and 5, dated to approximately 3.5 billion ' +
      'years ago, which exhibited chemical signatures consistent with prolonged liquid water ' +
      'interaction — specifically, carbonate and phyllosilicate mineralogy indicating neutral-pH, ' +
      'warm water conditions sustained for at minimum tens of thousands of years.',

      'Layer 2, dated to approximately 1.2 billion years ago and far younger than the water-altered ' +
      'strata, contains a material the team\'s instruments could not classify. Spectrographic ' +
      'analysis returned an elemental composition consistent with a known alloy of titanium, ' +
      'tungsten, and a trace element identified only as "unknown-Z." The material does not occur ' +
      'naturally in any known solar system body. It was found at depth. It was found everywhere the ' +
      'team drilled.',
    ],
  },

  // ── PERSONNEL ─────────────────────────────────────────────────────────────

  {
    id: 'PER-001',
    category: LoreCategory.PERSONNEL,
    title: 'Personal Log — Chief Engineer Daria Volkov',
    discovered: false,
    location: 'Sector Epsilon — Chief Engineer\'s Office',
    content: [
      'Log entry, Sol 871. I have not slept properly in eleven days. The vibration readings from ' +
      'the B3 foundation piles are unlike anything in my structural engineering reference library. ' +
      'The frequency profile matches nothing geological. I have run the analysis four times. The ' +
      'colony\'s structural integrity is not compromised — the vibrations are too low-amplitude for ' +
      'that — but their periodicity is unsettling. Geological processes are not this regular.',

      'Sol 876. I submitted a formal request to Administrator Brenner to suspend Sector Zeta ' +
      'construction pending a full subsurface survey. She denied it. She cited the project timeline ' +
      'and the upcoming ISA inspection. She said I was extrapolating from noise. I showed her the ' +
      'spectrograms. She looked at them for a long time and said nothing, then said the inspection ' +
      'would still proceed.',

      'Sol 882. The team found something in the B3 maintenance crawlspace during routine conduit ' +
      'inspection. I cannot describe it in this log — not because I don\'t want to, but because I ' +
      'don\'t have the language for it. Kenji took photographs. We have sealed the access hatch. I ' +
      'am going to talk to Brenner tonight. If she will not act, I will transmit the photographs ' +
      'to Earth myself.',
    ],
  },

  {
    id: 'PER-002',
    category: LoreCategory.PERSONNEL,
    title: 'Personal Log — Dr. Priya Mehta, Xenobiologist',
    discovered: false,
    location: 'Science Wing — Laboratory A',
    content: [
      'Sol 855. The fossilised structures are real. I\'ve had Chen and Osei run independent ' +
      'analyses blind — meaning I didn\'t tell them what they were looking for — and they both ' +
      'reported biological morphology. We have prokaryote-grade fossils from 3.4 billion years ago ' +
      'in the Hellas subsurface. This is, by any objective measure, the most significant scientific ' +
      'discovery in human history. I should be elated. I\'m terrified.',

      'Sol 867. The new samples from drill site three are not fossils. The structures are intact. ' +
      'The lipid membranes are intact. I ran the fluorescence assay three times. I got positive ' +
      'reads for metabolic activity markers. This is not a fossil. Whatever is in those cores from ' +
      '340 metres depth is not fossilised. It is dormant. Or it was dormant.',

      'Sol 888. I have stopped writing formal reports. I don\'t know who is reading them or what ' +
      'decisions are being made based on them. The commander knows. Brenner knows. I don\'t know ' +
      'what they\'re going to do. What I know is that we drilled down and woke something up, and now ' +
      'something is coming up toward the drill holes, and I don\'t think it\'s the organism. I think ' +
      'the organism was the announcement. Something else heard it.',
    ],
  },

  {
    id: 'PER-003',
    category: LoreCategory.PERSONNEL,
    title: 'Personal Log — Commander Takeshi Mori',
    discovered: false,
    location: 'Command Center — Commander\'s Quarters',
    content: [
      'Sol 890. I have made the decision. We are implementing Continuity Protocol. I\'ve ordered ' +
      'Volkov to begin the installation tonight. Most of the colony doesn\'t know what Continuity ' +
      'Protocol means — they think it\'s a data-backup procedure, because that\'s what we told them ' +
      'at the last all-hands. I\'m not proud of that.',

      'I am a scientist. I was trained to seek understanding, not to seal it away. But the thing ' +
      'below Sector Zeta is not something we can study from a safe distance on a two-year ISA grant. ' +
      'If what Mehta believes is true — if what Volkov found in B3 is what I think it is — then we ' +
      'need Earth to make this call, not us. Not 1,147 people in a colony that was never designed ' +
      'to be the front line of first contact.',

      'Sol 891. I have recorded a full briefing and encrypted it to ISA-ALPHA-7 priority. It will ' +
      'arrive at Earth in 22 minutes. By the time they send a response, many things may have ' +
      'changed. I don\'t know if I\'ll be here to receive it. Whatever happens next: we tried to be ' +
      'careful. We tried to do right by the people in our care. Some things are bigger than careful.',
    ],
  },

  {
    id: 'PER-004',
    category: LoreCategory.PERSONNEL,
    title: 'Personal Log — Kenji Watanabe, Structural Technician',
    discovered: false,
    location: 'Sector Epsilon — Maintenance Workshop',
    content: [
      'Sol 883. I don\'t know how to write this down in a way that sounds sane. We were in the B3 ' +
      'crawlspace replacing a cracked conduit segment when Yusra\'s torch caught the wall at the far ' +
      'end of the crawlspace — the solid rock wall, the part that was never excavated, the part that ' +
      'should just be bedrock — and there was a door.',

      'Not a recess. Not a void. A door. Recessed into the basalt, with a frame that was clearly ' +
      'machined, with geometry that was too precise to be natural and too ancient to be ours. The ' +
      'frame was that material — the one in the core samples that spectrographics couldn\'t classify. ' +
      'The door was closed. It had no visible mechanism. Yusra reached out to touch it and I pulled ' +
      'her hand back. I don\'t know why. Instinct.',

      'We took twenty-seven photographs. We sealed the hatch. Dr. Volkov knows. The Commander knows. ' +
      'I have a daughter on Earth. She\'s six. I keep thinking about her. I keep thinking about the ' +
      'shape of that frame and how it looked like it was waiting. Like it had always been waiting. ' +
      'I think we were always going to find it.',
    ],
  },

  // ── ANOMALY ───────────────────────────────────────────────────────────────

  {
    id: 'ANO-001',
    category: LoreCategory.ANOMALY,
    title: 'Subsurface Anomaly — Initial Detection',
    discovered: false,
    location: 'Science Wing — Geophysics Terminal',
    content: [
      'The first indication that something anomalous existed beneath Aurelia came not from a ' +
      'deliberate survey but from a routine maintenance sweep of the colony\'s seismic monitoring ' +
      'network. On Sol 743, automated analysis flagged a repeating low-frequency signal in the ' +
      '0.003–0.007 Hz range — frequencies below the threshold of human perception and well below ' +
      'typical geological microseismic activity. The signal was initially logged as instrument ' +
      'noise and dismissed.',

      'On Sol 798, a second instrument on the opposite side of the colony flagged an identical ' +
      'frequency signature. Cross-correlation analysis confirmed the signals were coherent — they ' +
      'were coming from the same source, localised by triangulation to a point approximately ' +
      '400 metres below the colony floor, directly beneath Sector Zeta. The probability that two ' +
      'spatially separated instruments would independently generate identical noise artifacts was ' +
      'calculated at less than 0.0001%.',

      'Dr. Mehta\'s team was briefed on Sol 802. The signal\'s frequency was not random. It ' +
      'corresponded, to within measurement error, to the resonant frequency of the prime-number ' +
      'harmonic series beginning at 0.003 Hz. This was either the most extraordinary coincidence ' +
      'in the history of geophysics, or it was a message.',
    ],
  },

  {
    id: 'ANO-002',
    category: LoreCategory.ANOMALY,
    title: 'Signal Analysis — Mathematical Structure',
    discovered: false,
    location: 'Science Wing — Data Analysis Suite',
    content: [
      'The signal analysis conducted by Dr. Mehta\'s team over the 40 sols following initial ' +
      'confirmation revealed a structure of extraordinary complexity hidden within what had appeared ' +
      'to be a simple periodic waveform. Fourier decomposition revealed 847 discrete frequency ' +
      'components. When ordered by amplitude, the ratios between adjacent components precisely ' +
      'reproduced the first 847 terms of the Farey sequence — a mathematical construct that does ' +
      'not appear in any known natural physical process.',

      'More disturbingly, the phase relationships between components encoded a secondary ' +
      'information layer that the team\'s signal processing software identified as a spatial ' +
      'coordinate system. The coordinates, when converted to Martian areocentric reference, ' +
      'described a precise three-dimensional grid of points distributed throughout the crust of ' +
      'Mars at depths between 200 metres and 40 kilometres. There were 1,024 points. They were ' +
      'distributed in a pattern consistent with a planetary-scale network.',

      'The team also noted that the signal\'s amplitude had been increasing since first detection — ' +
      'slowly, but measurably. Not linearly. Exponentially. When the team fitted an exponential ' +
      'growth curve and extrapolated forward, the signal would reach a threshold they termed ' +
      '"broadcast amplitude" — sufficient to propagate through the Martian crust without ' +
      'attenuation — in approximately 90 sols. Sol 892 was day 89.',
    ],
  },

  {
    id: 'ANO-003',
    category: LoreCategory.ANOMALY,
    title: 'Continuity Protocol — Installation Record',
    discovered: false,
    location: 'Command Center — Classified Archive Terminal',
    content: [
      'Continuity Protocol is an ISA Strategic Directive encoded into the mission parameters of ' +
      'every interplanetary colony, classified at ISA-ALPHA-7 level, known only to the colony ' +
      'commander and two designated successors. Its purpose is to ensure the preservation of a ' +
      'detailed record of any event deemed to be of civilisational significance, beyond the ' +
      'capacity of conventional data uplink to transmit reliably.',

      'The Protocol involves the installation of a hardened data archive — physically shielded ' +
      'against electromagnetic interference, radiation, and structural damage — at a location ' +
      'within or near the colony, its exact position encoded in a message transmitted to Earth. ' +
      'The archive contains a full copy of the colony\'s data corpus, Commander Mori\'s personal ' +
      'briefing, and all sensor, log, and research data related to the anomaly.',

      'Commander Mori authorised Continuity Protocol installation on Sol 890. Chief Engineer ' +
      'Volkov led the four-person installation team. The archive was placed at coordinates logged ' +
      'only in the encrypted ISA transmission. The installation was completed at 23:47 on Sol 891, ' +
      'approximately ninety minutes before the emergency broadcast. Volkov\'s team never returned ' +
      'to the colony interior.',
    ],
  },

  {
    id: 'ANO-004',
    category: LoreCategory.ANOMALY,
    title: 'Zone Delta-9 — Surface Survey Results',
    discovered: false,
    location: 'Garage Bay — Survey Mission Locker',
    content: [
      'Six weeks before the colony went dark, a three-person survey team in M-7-02 drove 340 ' +
      'kilometres southeast of Aurelia to a region designated Anomaly Zone Delta-9, where orbital ' +
      'synthetic-aperture radar imagery had revealed a subsurface reflectivity anomaly '  +
      'inconsistent with any known geological formation. The round trip took four sols.',

      'The survey team\'s report described a region of approximately 2 square kilometres in which ' +
      'the regolith surface, while visually indistinguishable from surrounding terrain, returned ' +
      'ground-penetrating radar echoes characteristic of a large void space at approximately ' +
      '80 metres depth. The void\'s boundaries were geometrically regular — orthogonal, with ' +
      'corners that radar tomography placed at near-perfect right angles.',

      'More significantly, the team\'s magnetometer detected intense, tightly localised magnetic ' +
      'field anomalies directly above the void\'s corners — anomalies that matched, in frequency ' +
      'and phase profile, the signal being detected beneath Aurelia Colony. The two sites were ' +
      '340 kilometres apart. They were part of the same system. Commander Mori was briefed ' +
      'immediately upon the team\'s return. Volkov\'s structural vibration data was re-examined ' +
      'in this new context. The Continuity Protocol decision followed nine days later.',
    ],
  },

  {
    id: 'ANO-005',
    category: LoreCategory.ANOMALY,
    title: 'Unknown Signal Origin — Pre-Colony Data',
    discovered: false,
    location: 'Communications Tower — Archive Cabinet',
    content: [
      'Following the discovery of the mathematical structure in the subsurface signal, the science ' +
      'team conducted a retrospective analysis of all seismic and electromagnetic data ever ' +
      'collected on Mars — including data from the precursor robotic missions and the extensive ' +
      'orbital sensor archives maintained by ISA since 2130. They were looking for earlier evidence ' +
      'of the signal.',

      'They found it. The earliest detectable signature consistent with the signal\'s frequency ' +
      'profile appeared in seismic data from the MarsNet-4 orbital seismograph, collected in 2148 — ' +
      'eleven years before Aurelia\'s construction began. The signal had been present, at very low ' +
      'amplitude, for at least that long. Possibly longer. The pre-2148 seismic archive was ' +
      'insufficiently sensitive to resolve signals at this amplitude.',

      'The implication — which the team stated explicitly in their internal briefing document ' +
      'and which Commander Mori underlined in his personal copy — was that the signal did not ' +
      'begin because humans arrived on Mars. Humans arrived on Mars because the signal was already ' +
      'there. Whether the site selection for Aurelia, deep in Hellas Planitia directly above a node ' +
      'in the planetary network, was a coincidence or a guided choice by parties unknown is a ' +
      'question the colony\'s records do not answer.',
    ],
  },

  // ── HELIOS ────────────────────────────────────────────────────────────────

  {
    id: 'HEL-001',
    category: LoreCategory.HELIOS,
    title: 'Helios Deep — First Confirmed Entry',
    discovered: false,
    location: 'Helios Facility — Entry Chamber',
    content: [
      'The structure designated Helios Deep was first entered by a team of four on Sol 891 — ' +
      'Chief Engineer Volkov, Commander Mori, Dr. Mehta, and Security Officer Ramos. They entered ' +
      'through the door discovered by Kenji Watanabe in the B3 crawlspace, using equipment that ' +
      'Volkov had prepared over the preceding ten sols. The door opened without mechanical ' +
      'intervention when Mori placed his hand on the frame. He later wrote that the frame was warm.',

      'The entry chamber beyond the door is approximately 30 metres long, 12 metres wide, and ' +
      '8 metres high. Its walls are composed of the same unclassified material identified in the ' +
      'geological core samples. The floor is smooth to within the resolution of the laser ' +
      'profilometer the team brought. There is no dust. No debris. No sign of age, degradation, ' +
      'or exposure, despite the structure having been sealed for an estimated 1.2 billion years.',

      'The team\'s lights revealed that the chamber walls bore markings — not random, not decorative ' +
      'in any human aesthetic sense, but structured in a way that Mehta immediately recognised as ' +
      'information. She spent forty minutes photographing them before Mori moved the team deeper ' +
      'into the structure. Her last entry in the mission log reads: "The markings describe a solar ' +
      'system. Not ours. Many solar systems. And in each one, the same structure, the same depth, ' +
      'the same door. This is not a first contact site. This is a waypoint."',
    ],
  },

  {
    id: 'HEL-002',
    category: LoreCategory.HELIOS,
    title: 'Ancient Planetary Engineering — Scope and Scale',
    discovered: false,
    location: 'Helios Facility — Central Analysis Chamber',
    content: [
      'The 1,024-point planetary network implied by the signal\'s embedded coordinate system is, ' +
      'if the team\'s interpretation is correct, a feat of engineering on a scale that dwarfs ' +
      'anything in human technological history. Each node in the network, spaced according to a ' +
      'precise geodetic grid, would require a structure comparable to Helios Deep — installed at ' +
      'depths ranging from 200 metres to 40 kilometres in the Martian crust.',

      'The energy required to build such a network — drilling, fabricating, and installing 1,024 ' +
      'installations of this scale — would exceed the total energy output of Earth\'s entire ' +
      'industrial civilisation across all of recorded history, by several orders of magnitude. ' +
      'The builders did not build it. They grew it. Analysis of the material\'s crystalline ' +
      'microstructure suggests that it was deposited by a directed self-replicating process — ' +
      'a nanotechnological cascade initiated at a single seed point and propagated through the ' +
      'rock over millions of years.',

      'The network was not built on Mars. It was built into Mars. The planet itself was engineered, ' +
      'or rather: the planet was used as a substrate for an engineering project whose purpose and ' +
      'whose engineers remain entirely unknown. What is known is that the project was unfinished. ' +
      'The signal\'s amplitude increase suggests that something, after 1.2 billion years of ' +
      'dormancy, has started the project again.',
    ],
  },

  {
    id: 'HEL-003',
    category: LoreCategory.HELIOS,
    title: 'The Ancient Machine — Purpose and Function',
    discovered: false,
    location: 'Helios Facility — Core Chamber',
    content: [
      'At the deepest accessible level of Helios Deep, the team discovered what Mehta\'s report ' +
      'terms "the primary processing node" — a chamber approximately 60 metres in diameter, ' +
      'dominated by a central structure that defies simple description. It is not a machine in any ' +
      'conventional sense. It has no visible moving parts, no discrete components recognisable as ' +
      'actuators, sensors, or processors. It is a continuous, unbroken form of the unclassified ' +
      'material, shaped by a process no member of the team could speculate about.',

      'What the team could determine, from the signal data and the chamber\'s embedded markings, is ' +
      'that the structure functions as a planetary-scale data processing system. The 1,024 network ' +
      'nodes collect information — seismic, electromagnetic, chemical, biological — from across the ' +
      'Martian crust, transmit it to this central node via the signal network, and the central node ' +
      'processes it. The processed output is not transmitted into the rock. It is transmitted upward, ' +
      'into space. The structure is broadcasting.',

      'The most unsettling element of Mehta\'s analysis is her assessment of what the system ' +
      'collects. It collects biological data. Specifically, it monitors for the emergence of ' +
      'complex life — the kind of life that builds colonies, that drills into planets, that ' +
      'generates the metabolic and electromagnetic signatures of technological civilisation. ' +
      'It has been watching Mars for 1.2 billion years, waiting for someone to find it. ' +
      'The colonists found it. The system is now transmitting. Somewhere, something is listening.',
    ],
  },

  {
    id: 'HEL-004',
    category: LoreCategory.HELIOS,
    title: 'Preserve or Awaken — The Final Question',
    discovered: false,
    location: 'Helios Facility — Core Chamber Interface',
    content: [
      'The Helios Deep interface — the means by which the system can be interacted with, if ' +
      '"interacted with" is even the correct phrase — was identified by Volkov as a specific ' +
      'configuration of the wall markings in the core chamber. Mehta\'s analysis of the marking ' +
      'system suggested that it functioned as both a descriptive language and a command interface: ' +
      'that certain arrangements of the markings, if physically traced in the correct sequence, ' +
      'would register as input to the processing node.',

      'Commander Mori\'s encrypted briefing to Earth describes two possible inputs that the team ' +
      'identified. The first would initiate a shutdown sequence — a controlled cessation of the ' +
      'planetary network\'s activity, halting the broadcast and returning the system to dormancy. ' +
      'Mori termed this option "Preserve." The second would do the opposite: accelerate the network ' +
      'to full broadcast power, completing whatever process the ancient engineers began 1.2 billion ' +
      'years ago. Mori termed this "Awaken."',

      'Mori\'s briefing states that the team reached the core chamber and identified the interface, ' +
      'but did not activate either option. He states that this decision — a decision of ' +
      'civilisational consequence — cannot and should not be made by four people in an underground ' +
      'chamber on Mars without authorisation. The briefing ends: "We are waiting for your response. ' +
      'Please send one soon." Earth never sent one. Now someone else has arrived, and the interface ' +
      'is still waiting.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns all lore entries belonging to the given category.
 */
export function getLoreByCategory(category: LoreCategory): LoreEntry[] {
  return LORE_DATABASE.filter((entry) => entry.category === category);
}

/**
 * Returns the lore entry with the given id, or undefined if not found.
 */
export function getLoreById(id: string): LoreEntry | undefined {
  return LORE_DATABASE.find((entry) => entry.id === id);
}
