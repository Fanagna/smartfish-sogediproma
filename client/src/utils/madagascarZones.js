// ─── Zones de pêche réelles de Madagascar ───
// Coordonnées, couleurs, descriptions, espèces clés, saisonnalité

export const MADAGASCAR_CENTER = [-19.5, 46.5]
export const MADAGASCAR_ZOOM = 6

export const MADAGASCAR_BOUNDS = [
  [-26.5, 42.0], // SW
  [-11.5, 51.5], // NE
]

// ─── Zones de pêche principales ───
export const ZONE_COORDS = {
  // ═══ Canal de Mozambique (Côte Ouest) ═══
  'Plateau de Toliara': {
    lat: -23.35, lng: 43.52,
    color: '#0EA5E9',
    desc: 'Plateau continental de Toliara — principale zone de pêche crevettière et langoustière du sud-ouest',
    especes: ['Crevette', 'Langouste', 'Poulpe', 'Thon albacore', 'Dorade', 'Mérou'],
    saison: 'Mai–Novembre (saison sèche)',
    profondeur: '20–200 m',
    type: 'plateau',
    ports: ['Toliara', 'Morombe', 'Androka'],
    reglementation: 'ZAR de Toliara — permis Z03 requis',
  },
  'Banc du Cap Saint-André': {
    lat: -17.20, lng: 43.80,
    color: '#06B6D4',
    desc: 'Important plateau de pêche au nord de Morondava — thons et petits pélagiques',
    especes: ['Thon albacore', 'Thon rouge', 'Maquereau', 'Sardine', 'Espadon'],
    saison: 'Avril–Octobre',
    profondeur: '50–500 m',
    type: 'banc',
    ports: ['Morondava', 'Maintirano', 'Besalampy'],
    reglementation: 'Permis Z02 requis',
  },
  'Plateau de Majunga': {
    lat: -15.70, lng: 46.00,
    color: '#14B8A6',
    desc: 'Plateau continental nord-ouest — zone de pêche artisanale et industrielle intense',
    especes: ['Crevette', 'Mulet', 'Bar', 'Mérou', 'Pagre', 'Calmar'],
    saison: 'Juin–Décembre',
    profondeur: '10–150 m',
    type: 'plateau',
    ports: ['Mahajanga', 'Marovoay', 'Soalala'],
    reglementation: 'ZAR de Majunga — permis Z01',
  },
  'Canal de Mozambique Nord': {
    lat: -13.50, lng: 47.50,
    color: '#3B82F6',
    desc: 'Zone hauturière nord du Canal de Mozambique — thonidés migrateurs et espadon',
    especes: ['Thon albacore', 'Thon rouge', 'Espadon', 'Voilier', 'Mahi-mahi'],
    saison: 'Août–Mars',
    profondeur: '500–3000 m',
    type: 'hauturiere',
    ports: ['Nosy Be', 'Antsiranana', 'Hell-Ville'],
    reglementation: 'Pêche hauturière — permis TH01',
  },
  'Banc du Leven': {
    lat: -12.50, lng: 48.20,
    color: '#6366F1',
    desc: 'Plateau au nord-ouest de Nosy Be — zone riche en poissons pélagiques et démersaux',
    especes: ['Thon albacore', 'Thon rouge', 'Espadon', 'Mérou', 'Pagre', 'Bonite'],
    saison: 'Toute l\'année (pic Août–Novembre)',
    profondeur: '30–400 m',
    type: 'banc',
    ports: ['Nosy Be', 'Antsiranana', 'Ambanja'],
    reglementation: 'Permis Z01/TH01',
  },
  'Baie de Mahajamba': {
    lat: -15.20, lng: 46.80,
    color: '#22C55E',
    desc: 'Estuaire et baie riche en crevettes, poissons de mangrove et mulets',
    especes: ['Crevette', 'Mulet', 'Bar', 'Mérou', 'Sole', 'Rouget'],
    saison: 'Mars–Septembre',
    profondeur: '5–30 m',
    type: 'estuaire',
    ports: ['Mahajanga', 'Maevatanana'],
    reglementation: 'Zone artisanale réglementée',
  },

  // ═══ Côte Est (Océan Indien) ═══
  'Côte Est — Tamatave': {
    lat: -18.15, lng: 49.60,
    color: '#F59E0B',
    desc: 'Plateau continental est au large de Toamasina — thonidés et poissons démersaux',
    especes: ['Thon albacore', 'Thon rouge', 'Espadon', 'Mulet', 'Mérou', 'Pagre'],
    saison: 'Septembre–Février',
    profondeur: '20–300 m',
    type: 'plateau',
    ports: ['Toamasina', 'Fénérive-Est', 'Mahambo'],
    reglementation: 'Permis Z05 requis',
  },
  'Côte Est — Mananara': {
    lat: -16.20, lng: 49.90,
    color: '#F97316',
    desc: 'Zone de pêche bordant la péninsule Masoala — poissons récifaux et pélagiques',
    especes: ['Mérou', 'Pagre', 'Dorade', 'Thon albacore', 'Calmar', 'Rouget'],
    saison: 'Août–Janvier',
    profondeur: '10–200 m',
    type: 'plateau',
    ports: ['Mananara', 'Maroantsetra', 'Antalaha'],
    reglementation: 'Aire marine gérée — permis Z05',
  },
  'Sainte-Marie / Nosy Boraha': {
    lat: -16.90, lng: 50.20,
    color: '#EC4899',
    desc: 'Île Sainte-Marie et ses récifs — zone de pêche et de reproduction des baleines',
    especes: ['Thon albacore', 'Dorade', 'Mérou', 'Pagre', 'Calmar', 'Crevette'],
    saison: 'Juillet–Décembre',
    profondeur: '10–150 m',
    type: 'recifal',
    ports: ['Île Sainte-Marie', 'Soanierana Ivongo'],
    reglementation: 'Aire marine protégée — pêche réglementée',
  },
  'Côte Est — Fort Dauphin': {
    lat: -25.00, lng: 47.10,
    color: '#EF4444',
    desc: 'Plateau du sud-est — zone de pêche crevettière et langoustière',
    especes: ['Crevette', 'Langouste', 'Poulpe', 'Mérou', 'Dorade', 'Pagre'],
    saison: 'Mai–Novembre',
    profondeur: '20–250 m',
    type: 'plateau',
    ports: ['Taolagnaro', 'Manantenina', 'Vangaindrano'],
    reglementation: 'Permis Z04 requis',
  },
  'Baie d\'Antongil': {
    lat: -15.80, lng: 50.00,
    color: '#A855F7',
    desc: 'Grande baie au sud de Masoala — nourricerie pour nombreuses espèces',
    especes: ['Crevette', 'Mulet', 'Bar', 'Mérou', 'Sole', 'Rouget'],
    saison: 'Août–Février',
    profondeur: '5–80 m',
    type: 'baie',
    ports: ['Maroantsetra', 'Antalaha', 'Mananara'],
    reglementation: 'Zone de nurserie — pêche artisanale uniquement',
  },

  // ═══ Nord ═══
  'Nosy Be — Archipel': {
    lat: -13.30, lng: 48.30,
    color: '#8B5CF6',
    desc: 'Archipel de Nosy Be — zone touristique et de pêche artisanale récifale',
    especes: ['Langouste', 'Poulpe', 'Mérou', 'Pagre', 'Dorade', 'Calmar'],
    saison: 'Toute l\'année (pic Mai–Novembre)',
    profondeur: '5–60 m',
    type: 'recifal',
    ports: ['Hell-Ville', 'Nosy Komba', 'Nosy Mitsio'],
    reglementation: 'Zone artisanale réglementée',
  },
  'Antsiranana — Baie des Dunes': {
    lat: -12.20, lng: 49.30,
    color: '#D946EF',
    desc: 'Baie d\'Antsiranana (Diego Suarez) — grande baie protégée aux eaux profondes',
    especes: ['Thon albacore', 'Espadon', 'Mérou', 'Pagre', 'Bonite', 'Calmar'],
    saison: 'Toute l\'année',
    profondeur: '10–500 m',
    type: 'baie',
    ports: ['Antsiranana', 'Ramena', 'Joffreville'],
    reglementation: 'Port franc — tous permis',
  },

  // ═══ Sud ═══
  'Côte Sud — Cap Sainte Marie': {
    lat: -25.60, lng: 45.20,
    color: '#DC2626',
    desc: 'Eaux riches du sud — confluence des courants du Canal de Mozambique et de l\'Océan Indien',
    especes: ['Thon albacore', 'Espadon', 'Langouste', 'Poulpe', 'Dorade', 'Bonite'],
    saison: 'Avril–Octobre',
    profondeur: '50–1500 m',
    type: 'hauturiere',
    ports: ['Toliara', 'Ampanihy', 'Itampolo'],
    reglementation: 'Zone hauturière — permis TH01',
  },
}

// ─── Aires Marines Protégées (AMP) ───
export const MARINE_PROTECTED_AREAS = [
  {
    nom: 'AMP Masoala',
    lat: -15.70, lng: 50.20,
    radius: 0.8, // degrés
    color: '#22C55E',
    desc: 'Parc national marin de Masoala — plus grande aire marine protégée de Madagascar',
    niveau: 'intégrale',
  },
  {
    nom: 'AMP Nosy Atafana',
    lat: -16.00, lng: 49.90,
    radius: 0.3,
    color: '#16A34A',
    desc: 'Réserve marine communautaire de Nosy Atafana',
    niveau: 'communautaire',
  },
  {
    nom: 'AMP Toliara (ZAR)',
    lat: -23.40, lng: 43.65,
    radius: 1.0,
    color: '#15803D',
    desc: 'Zone d\'Aménagement Réglementée de Toliara — gestion durable des crevettes',
    niveau: 'réglementée',
  },
  {
    nom: 'AMP Nosy Hara',
    lat: -12.50, lng: 48.00,
    radius: 0.4,
    color: '#166534',
    desc: 'Réserve marine de Nosy Hara — écosystème préservé du nord',
    niveau: 'intégrale',
  },
  {
    nom: 'AMP Barren Isles',
    lat: -17.10, lng: 43.60,
    radius: 0.6,
    color: '#14532D',
    desc: 'Îles Barren — zone de reproduction majeure pour les poissons et oiseaux marins',
    niveau: 'intégrale',
  },
  {
    nom: 'AMP Velondriake',
    lat: -21.80, lng: 43.35,
    radius: 0.5,
    color: '#052E16',
    desc: 'Plus grande aire marine gérée localement de l\'Océan Indien — sud-ouest de Madagascar',
    niveau: 'communautaire',
  },
]

// ─── Espèces de Madagascar (liste étendue) ───
export const MADAGASCAR_ESPECES = [
  'Thon albacore', 'Thon rouge', 'Espadon', 'Voilier', 'Mahi-mahi', 'Bonite',
  'Crevette', 'Langouste', 'Poulpe', 'Calmar',
  'Mérou', 'Pagre', 'Dorade', 'Rouget', 'Bar', 'Mulet', 'Sole', 'Anchois',
  'Sardine', 'Maquereau', 'Requin', 'Raie',
  'Thazar', 'Carangue', 'Lethrinidés', 'Lutjanidés', 'Séridiole', 'Ombrine',
]

// ─── Couleurs par espèce ───
export const SPECIES_COLORS_MADA = {
  'Thon albacore': '#2563EB',
  'Thon rouge': '#DC2626',
  'Espadon': '#9333EA',
  'Voilier': '#7C3AED',
  'Mahi-mahi': '#F59E0B',
  'Bonite': '#0891B2',
  'Crevette': '#F97316',
  'Langouste': '#DB2777',
  'Poulpe': '#0D9488',
  'Calmar': '#C026D3',
  'Mérou': '#22C55E',
  'Pagre': '#EAB308',
  'Dorade': '#FBB13C',
  'Rouget': '#FF6900',
  'Bar': '#10B981',
  'Mulet': '#06B6D4',
  'Sole': '#6366F1',
  'Anchois': '#84CC16',
  'Sardine': '#0EA5E9',
  'Maquereau': '#8B5CF6',
  'Requin': '#64748B',
  'Raie': '#475569',
  'Thazar': '#2DD4BF',
  'Carangue': '#38BDF8',
  'Lethrinidés': '#A3E635',
  'Lutjanidés': '#FB923C',
  'Séridiole': '#818CF8',
  'Ombrine': '#94A3B8',
}

export function getSpeciesColor(espece) {
  return SPECIES_COLORS_MADA[espece] || '#6B7280'
}

// ─── Saisons de pêche ───
export const SAISONS_PECHE = [
  {
    nom: 'Saison sèche',
    periode: 'Mai – Octobre',
    conditions: 'Alizés modérés, mer calme, bonne visibilité',
    vent_moyen: '15–25 km/h',
    temp_mer_moy: '24–27°C',
    zones_recommandees: ['Plateau de Toliara', 'Côte Est — Tamatave', 'Banc du Cap Saint-André'],
    especes_abondantes: ['Thon albacore', 'Thon rouge', 'Crevette', 'Langouste', 'Espadon'],
    alertes: 'Possibles coups de vent en juillet-août',
    icone: '☀️',
  },
  {
    nom: 'Saison des pluies',
    periode: 'Novembre – Avril',
    conditions: 'Mousson, cyclones possibles, mer agitée',
    vent_moyen: '25–45 km/h',
    temp_mer_moy: '28–31°C',
    zones_recommandees: ['Côte Est — Fort Dauphin', 'Canal de Mozambique Nord', 'Nosy Be — Archipel'],
    especes_abondantes: ['Poulpe', 'Calmar', 'Mérou', 'Pagre', 'Dorade', 'Mahi-mahi'],
    alertes: '⚠️ Risque cyclonique janvier-mars — surveiller METEO MADAGASCAR',
    icone: '🌧️',
  },
  {
    nom: 'Repos biologique crevettier',
    periode: 'Décembre – Février',
    conditions: 'Fermeture de la pêche crevettière — arrêté ministériel',
    vent_moyen: '20–35 km/h',
    temp_mer_moy: '27–30°C',
    zones_recommandees: ['Toutes zones hors crevettiers'],
    especes_abondantes: ['Thon albacore', 'Espadon', 'Mérou', 'Pagre', 'Dorade'],
    alertes: '⚠️ INTERDICTION DE PÊCHE CREVETTIÈRE du 1er déc. au 28 fév.',
    icone: '🛑',
  },
]

// ─── Données météo simulées réalistes par zone ───
export function getMeteoForZone(zoneName) {
  const now = new Date()
  const month = now.getMonth() // 0-11
  const isDrySeason = month >= 4 && month <= 9 // Mai-Octobre
  const isCycloneSeason = month >= 0 && month <= 3 // Janvier-Avril

  const zone = ZONE_COORDS[zoneName]
  if (!zone) return null

  // Base values vary by zone type and season
  const baseTemp = isDrySeason ? 25 : 29
  const baseWind = isDrySeason ? 18 : 28
  const baseWave = isDrySeason ? 1.2 : 2.5

  // Adjust by zone type
  const typeMultiplier = {
    'plateau': { temp: 0, wind: 1, wave: 1 },
    'banc': { temp: -0.5, wind: 1.2, wave: 1.3 },
    'hauturiere': { temp: -1, wind: 1.5, wave: 1.8 },
    'estuaire': { temp: 1, wind: 0.6, wave: 0.3 },
    'recifal': { temp: 0.5, wind: 0.7, wave: 0.5 },
    'baie': { temp: 0.5, wind: 0.5, wave: 0.4 },
  }
  const tm = typeMultiplier[zone.type] || { temp: 0, wind: 1, wave: 1 }

  // Add some randomness
  const seed = zoneName.length
  const noise = (seed * 7 + seed % 3) / 10

  const temp = baseTemp + tm.temp + (noise - 0.15)
  const wind = (baseWind * tm.wind) + (noise - 0.2) * 3
  const wave = (baseWave * tm.wave) + (noise - 0.25) * 0.3

  const windDir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][
    Math.round((((now.getHours() * 15 + seed * 23) % 360) / 45)) % 8
  ]

  return {
    temperature_mer: Math.round(temp * 10) / 10,
    vent_force: Math.round(wind),
    vent_direction: windDir,
    hauteur_vagues: Math.round(wave * 10) / 10,
    visibilite: isDrySeason ? 'Bonne' : (isCycloneSeason ? 'Moyenne' : 'Bonne'),
    alerte_cyclone: isCycloneSeason && (noise > 0.55), // déterministe via seed
    pression: Math.round(1013 + (Math.random() - 0.5) * 20),
    humidite: Math.round(isDrySeason ? 65 + Math.random() * 10 : 80 + Math.random() * 15),
    courant: ['Faible', 'Modéré', 'Fort'][Math.round(Math.random() * 2)],
    condition_peche: wind < 15 ? 'Idéale' : wind < 25 ? 'Favorable' : wind < 35 ? 'Difficile' : 'Déconseillée',
  }
}
