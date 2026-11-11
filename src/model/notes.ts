export type BodyKind = 'land' | 'sea' | 'abalone' | 'nautilus' | 'hermit' | 'worm' | 'threads' | 'none'

export type Note = {
  fact: string
  body: BodyKind
  flesh: string
  parts?: Record<string, string>
}

const sea = (fact: string, flesh = '#b7a48c', parts?: Record<string, string>): Note => ({
  fact,
  body: 'sea',
  flesh,
  parts,
})

const valve = (fact: string, parts?: Record<string, string>): Note => ({
  fact,
  body: 'none',
  flesh: '#d2c4b0',
  parts: { apex: 'Beak', lip: 'Valve margin', ...parts },
})

export const NOTES: Record<string, Note> = {
  turritella: sea(
    'Unlike most snails, it does not graze. It buries in the sand and strains food from the water with cilia.',
  ),
  terebra: sea(
    'An auger hunts bristle worms under the sand. Many stab the worm with a venomous tooth, a harpoon evolved apart from the cone shells.',
    '#8d7360',
  ),
  melanoides: sea(
    'Most individuals are female and produce young without a mate. The brood is carried in a pouch behind the head.',
    '#6a5344',
  ),
  epitonium: sea(
    'It feeds on sea anemones. The white shell was once so costly that eighteenth-century copies were made of rice paste.',
    '#ddd6cc',
  ),
  lymnaea: sea(
    'A classic animal in the study of memory. Some of its neurons are large enough to record one at a time.',
    '#cabb9e',
  ),
  charonia: sea(
    'One of the few predators that can take a crown-of-thorns starfish.',
    '#cbb89a',
  ),
  lissachatina: {
    fact: 'The shell can grow longer than a hand. Carried by people, it has become a crop pest across the tropics.',
    body: 'land',
    flesh: '#8a705c',
  },
  buccinum: sea(
    'A scavenger of the North Atlantic. When the snail dies, a hermit crab often moves into the shell.',
    '#c8beb0',
  ),
  rochia: sea('The thick pearly shell was cut into buttons by the million.', '#ddd4c6'),
  cornu: {
    fact: 'Raised for the table, and carried with European farming until it lives on coasts and in gardens worldwide.',
    body: 'land',
    flesh: '#6e5b4c',
  },
  pagurus: {
    fact: 'It grows no shell. As it outgrows each one it will fight another crab for a roomier whelk.',
    body: 'hermit',
    flesh: '#b5523a',
    parts: { aperture: 'Shell mouth', apex: 'Borrowed spire' },
  },
  murex: sea(
    'The spines are extraordinarily long, a comb these three numbers do not grow.',
    '#cbb89e',
  ),
  helix: {
    fact: 'In winter it seals the mouth with a chalky lid, the epiphragm, and sleeps until the ground warms.',
    body: 'land',
    flesh: '#c8b8a6',
  },
  spirorbis: {
    fact: 'The worm never leaves its tube. It broods the young inside, and they swim off to cement a coil of their own.',
    body: 'worm',
    flesh: '#f4f7f5',
    parts: { aperture: 'Tube mouth', periphery: 'Coil' },
  },
  littorina: sea(
    'On a rocky shore its grazing can strip the algae back to bare rock, and the whole community changes.',
    '#6a6c68',
  ),
  planorbarius: sea(
    'The blood is red. Hemoglobin, rare in a snail, lets it live in stagnant, poorly oxygenated water.',
    '#8a5a4c',
  ),
  planorbis: sea(
    'The coil is left-handed, a mirror of most snails, and it presses flat against the mud.',
    '#6e463c',
  ),
  elphidium: {
    fact: 'One cell. It keeps the chloroplasts of the algae it eats, and they go on making food inside it.',
    body: 'none',
    flesh: '#c8c0ae',
    parts: { aperture: 'Aperture', whorl: 'Whorl of the test' },
  },
  dactylioceras: {
    fact: 'Among the most abundant ammonites of the Early Jurassic. The ribs are preserved. The soft body is not.',
    body: 'none',
    flesh: '#b7a48c',
    parts: { periphery: 'Ribbed venter' },
  },
  asteroceras: {
    fact: 'It gives its name to a slice of Early Jurassic time, the Obtusum Zone, a little under 200 million years ago.',
    body: 'none',
    flesh: '#b7a48c',
    parts: { periphery: 'Venter' },
  },
  argonauta: {
    fact: 'The female shapes it with two webbed arms, not with a mantle, and she is many times the size of the male.',
    body: 'none',
    flesh: '#e6dcc8',
    parts: { aperture: 'Case opening', periphery: 'Keel' },
  },
  powelliphanta: {
    fact: 'It swallows earthworms whole on the forest floor, and it is thought to live for decades.',
    body: 'land',
    flesh: '#2c3028',
  },
  paryphanta: {
    fact: 'A carnivore of the kauri forests. It eats earthworms and other snails, and it has become scarce.',
    body: 'land',
    flesh: '#3e4634',
  },
  'cepaea-nemoralis': {
    fact: 'Song thrushes break the shells on stone anvils. Yellow shells and banded shells survive at different rates in grass and in woods.',
    body: 'land',
    flesh: '#a3988c',
  },
  lunella: sea(
    "The green cat's eye is not the shell. It is the operculum, a door the animal pulls shut, and it is cut as a gem.",
    '#3d6e58',
  ),
  'cepaea-hortensis': {
    fact: 'The pale lip separates it from the grove snail. The two live side by side and seldom interbreed.',
    body: 'land',
    flesh: '#b3a898',
  },
  'pomacea-diffusa': sea(
    'The aquarium mystery snail. It climbs out of the water to lay a pale clutch of eggs on a stem.',
    '#c2b48a',
  ),
  aliger: sea(
    'A flared lip means the conch is adult, and it leaps by kicking with the operculum. The rare pink conch pearl is not nacre, and these numbers do not draw it.',
    '#d2b2a0',
  ),
  'pomacea-canaliculata': sea(
    'A pest of rice. The bright pink eggs are laid on stems above the water, where fish cannot reach them.',
    '#c6b56a',
  ),
  spirula: sea(
    'The coil is a float of gas-filled chambers, carried inside the body. Empty shells wash ashore long after the squid is gone.',
    '#e4ddd4',
    { whorl: 'Open whorl', aperture: 'Shell aperture' },
  ),
  nautilus: {
    fact: 'A tube called the siphuncle empties the older chambers, and the shell floats. A pearl is very rare. The arms have no suckers.',
    body: 'nautilus',
    flesh: '#e4d5c4',
    parts: { chamber: 'Living chamber' },
  },
  neverita: sea(
    'It bores a neat hole through another shell and eats the animal inside. The eggs are laid in a collar of sand.',
    '#c8c4ba',
  ),
  cassis: sea('It feeds on sea urchins, gripping them with a large foot.', '#c49262'),
  conus: sea(
    'It hunts other snails. The venom, delivered on a barbed tooth, is dangerous to a person who handles it.',
    '#d2c4ae',
  ),
  tonna: sea(
    'It feeds on sea cucumbers, softening them with an acidic saliva.',
    '#c8aa80',
  ),
  ovis: {
    fact: 'Keratin over a bony core, not a shell. The horn grows from the base for as long as the ram lives.',
    body: 'none',
    flesh: '#c4a06a',
    parts: { tip: 'Tip', base: 'Base' },
  },
  cypraea: sea(
    'In life the mantle slides out over the shell and polishes it. That is why the spiral is hidden and the surface is glossy.',
    '#e6d8cc',
    { apex: 'Spire' },
  ),
  oliva: sea(
    'The polish lets it slip through sand. A huge foot wraps the prey, and the short spire stays buried.',
    '#6a5040',
    { apex: 'Spire' },
  ),
  haliotis: {
    fact: 'The foot is black, which is why this is the blackfoot pāua. Pāua pearls are brightly coloured. They form in the mantle, and the coil drawn here does not include them.',
    body: 'abalone',
    flesh: '#141614',
    parts: { interior: 'Nacre', spire: 'Spire' },
  },
  dentalium: {
    fact: 'The wide end stays buried. Thread-like captacula reach from it to catch foraminifera, while the narrow tip opens into the water.',
    body: 'threads',
    flesh: '#f3eee4',
    parts: { tip: 'Narrow tip', aperture: 'Wide end' },
  },
  loxodonta: {
    fact: 'An upper incisor, made of dentine. It grows from the root for the whole life of the elephant.',
    body: 'none',
    flesh: '#efe6d4',
    parts: { tip: 'Tip', base: 'Base' },
  },
  mercenaria: valve(
    'Edible clams sometimes grow a pearl, usually dull and not nacre. The violet stain inside this quahog was worked into wampum beads.',
  ),
  melo: sea(
    'The Indian volute can grow a large orange pearl. The pearl is not nacre, and it is not this shell. The coil is a swollen body whorl with a short spire.',
    '#e0a05a',
  ),
  pinctada: valve(
    'Akoya, South Sea, and Tahitian black pearls come from different Pinctada. This is the black-lip. The pearl is nacre around a grain, and it is not part of the coil.',
  ),
  sinohyriopsis: valve(
    'Most freshwater cultured pearls, especially those from China, come from this mussel, long called Hyriopsis. The pearl is grown in the mantle.',
  ),
  pinna: valve(
    'Pen shells can grow pearls, often brown or orange. The shell is a long thin triangle. The golden byssus threads are not drawn.',
  ),
  'ostrea-edulis': valve(
    'Edible oysters, and clams such as the quahog, sometimes grow a pearl. It is usually dull, not nacre, and not worth cutting as a gem.',
  ),
  mytilus: valve(
    'The blue mussel ties itself to rock with byssus threads. The wedge is the valve pulled long. The threads are not in the coil.',
  ),
  perna: valve(
    'The green-lipped mussel of New Zealand. The green is the margin of the valve. The animal is farmed on hanging ropes.',
  ),
  magallana: valve(
    'The Pacific oyster, farmed more widely than any other. The shell cements to a hard surface and grows flutes these three numbers do not make.',
  ),
  saccostrea: valve(
    'A rock oyster. It settles on shore rock and grows a small cupped valve. The cement and the frill are not in the coil.',
  ),
  'ostrea-chilensis': valve(
    'The Bluff oyster, dredged from Foveaux Strait. It is a flat, slow-growing Ostrea, not the Pacific oyster.',
  ),
  tridacna: valve(
    'The giant clam. The shell can be more than a metre across. The bright mantle farms algae in its tissues, and that animal is not drawn.',
  ),
  cerastoderma: valve(
    'The common cockle. Strong ribs run from the beak, and the animal can jump by kicking its foot. The ribs here are a texture on the valve.',
  ),
  pecten: valve(
    'A scallop swims by clapping its valves and forcing the water out. The ears beside the hinge are not part of this coil.',
  ),
  ensis: valve(
    'A razor clam. The valve is long and narrow, and the animal can burrow faster than a person can dig.',
  ),
  'paphies-australis': valve(
    'The pipi, a beach clam of New Zealand. The valve is a rounded wedge, beside the more triangular tuatua in this corner of the cube.',
  ),
  'paphies-subtriangulata': valve(
    'The tuatua lives in the surf zone. Its valve is more triangular than the pipi. Both are Paphies.',
  ),
  panopea: valve(
    'A geoduck. The shell is the small valve. The siphon can be as long as an arm, and it is not drawn.',
  ),
  teredo: valve(
    'A shipworm bores into wood. The shell is a tiny pair of valves at the front of a worm-shaped body, used as a drill. Only that little valve is drawn.',
    { lip: 'Cutting edge' },
  ),
  dreissena: valve(
    'The zebra mussel. Dark stripes mark a small triangular valve. Carried on boats, it spreads through rivers and clogs pipes.',
  ),
}

export function noteFor(id: string): Note {
  return NOTES[id] ?? { fact: '', body: 'none', flesh: '#b7a48c' }
}
