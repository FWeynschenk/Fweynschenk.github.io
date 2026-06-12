// Platedle core game logic. Pure JS (no DOM) so it can also be run under
// node for probability calibration (see PROBS at the bottom).

// Dutch licence plate "sidecodes". Older formats are weighted rarer.
export const SIDECODES = [
  { sc: 1, fmt: "XX-99-99", weight: 1 },
  { sc: 2, fmt: "99-99-XX", weight: 1 },
  { sc: 3, fmt: "99-XX-99", weight: 2 },
  { sc: 4, fmt: "XX-99-XX", weight: 5 },
  { sc: 5, fmt: "XX-XX-99", weight: 8 },
  { sc: 6, fmt: "99-XX-XX", weight: 12 },
  { sc: 7, fmt: "99-XXX-9", weight: 16 },
  { sc: 8, fmt: "9-XXX-99", weight: 18 },
  { sc: 9, fmt: "XX-999-X", weight: 18 },
  { sc: 10, fmt: "X-999-XX", weight: 19 },
];

const TOTAL_WEIGHT = SIDECODES.reduce((a, s) => a + s.weight, 0);
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generatePlate(rng = Math.random) {
  let pick = rng() * TOTAL_WEIGHT;
  let side = SIDECODES[SIDECODES.length - 1];
  for (const s of SIDECODES) {
    pick -= s.weight;
    if (pick < 0) { side = s; break; }
  }
  let text = "";
  for (const ch of side.fmt) {
    if (ch === "X") text += ALPHABET[Math.floor(rng() * 26)];
    else if (ch === "9") text += Math.floor(rng() * 10);
    else text += ch;
  }
  return describePlate(text, side.sc);
}

export function describePlate(text, sc) {
  const alnum = text.replace(/-/g, "");
  const letters = alnum.replace(/[0-9]/g, "");
  const digits = alnum.replace(/[A-Z]/g, "");
  return { text, sc, alnum, letters, digits, groups: text.split("-") };
}

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}

function isStraight(s) {
  if (s.length < 3) return false;
  let asc = true, desc = true;
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i) !== s.charCodeAt(i - 1) + 1) asc = false;
    if (s.charCodeAt(i) !== s.charCodeAt(i - 1) - 1) desc = false;
  }
  return asc || desc;
}

function isSorted(s, dir = 1) {
  if (s.length < 2) return false;
  for (let i = 1; i < s.length; i++)
    if ((s.charCodeAt(i) - s.charCodeAt(i - 1)) * dir < 0) return false;
  return true;
}

function allSame(s) {
  return s.length >= 2 && [...s].every((c) => c === s[0]);
}

function digitSum(s) {
  return [...s].reduce((a, c) => a + +c, 0);
}

const POWERS_OF_TWO = new Set([16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]);
const FIBS = new Set([13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765]);
const SQUARES = new Set(Array.from({ length: 98 }, (_, i) => (i + 2) ** 2).filter((n) => n <= 9999));
const CUBES = new Set([27, 64, 125, 216, 343, 512, 729, 1000, 1728, 2197, 2744, 3375, 4096, 4913, 5832, 6859, 8000, 9261]);
const VOWELS = new Set("AEIOU");
const ROMAN = new Set("IVXLCDM");
const WORDS3 = new Set([
  "ACE","AIR","ALE","ANT","APE","ARM","ART","ASH","AXE","BAD","BAG","BAN","BAR","BAT",
  "BAY","BED","BEE","BET","BIG","BIN","BIT","BOW","BOX","BOY","BRO","BUG","BUN","BUS",
  "CAB","CAP","CAR","CAT","COD","COP","COW","CUB","CUE","CUP","CUT","DAD","DAY","DEN",
  "DEW","DIG","DIM","DIP","DOG","DOT","DRY","DUO","EAR","EEL","EGG","ELF","ELK","EMU",
  "END","ERA","EYE","FAN","FAR","FAT","FEE","FEW","FIG","FIN","FIR","FIX","FLY","FOG",
  "FOX","FUN","GAP","GAS","GEL","GEM","GIG","GNU","GUM","GUN","GUY","GYM","HAM","HAT",
  "HAY","HEN","HIP","HIT","HOG","HOT","HUB","HUE","HUG","HUT","ICE","ICY","INK","IVY",
  "JAM","JAR","JAW","JET","JOB","JOG","JOY","KEG","KEY","KID","KIT","KOI","LAB","LAD",
  "LAP","LAW","LEG","LID","LIP","LIT","LOG","LOT","LOW","MAD","MAP","MAX","MEN","MIX",
  "MOM","MUD","MUG","NAP","NET","NEW","NIL","NOD","NUN","NUT","OAK","OAR","OAT","ODD",
  "OIL","OLD","ONE","ORB","ORE","OWL","OWN","PAL","PAN","PAW","PEA","PEN","PET","PIE",
  "PIG","PIN","POD","POP","POT","PRO","PUB","PUG","PUP","RAD","RAG","RAM","RAT","RAW",
  "RAY","RED","RIB","RIM","ROB","ROD","ROW","RUG","RUM","RUN","RYE","SAD","SAP","SAW",
  "SEA","SIP","SIR","SIX","SKI","SKY","SLY","SOB","SOD","SON","SOY","SPA","SPY","SUN",
  "TAB","TAG","TAN","TAR","TAX","TEA","TEN","TIN","TIP","TOE","TON","TOP","TOY","TUB",
  "TUG","URN","VAN","VAT","VET","VOW","WAD","WAG","WAR","WAX","WAY","WEB","WET","WHY",
  "WIG","WIN","WOK","WOW","YAK","YAM","YES","YEW","ZAP","ZEN","ZIP","ZOO",
  "AAP","KIP","KAT","JAS","UIL","EZL","PSV","AJX",
]);
const WORDS2 = new Set([
  "AT","AX","BE","BY","DO","GO","HI","IF","IN","IS","IT","ME","MY","NO","OF","OK",
  "ON","OR","OX","PI","SO","TO","UP","US","WE","YO",
]);
const MEMES = new Set([
  "LOL","WTF","OMG","FML","KEK","SUS","UWU","BRB","IRL","SOS","VIP","UFO","DNA","GOA",
  "XD","GG","EZ","OP","AI","OK","NO","YE","LV",
]);
const AGENCIES = new Set(["FBI", "CIA", "KGB", "NSA", "FSB", "DEA", "ATF", "AIVD"]);
const DUTCH = new Set(["NL", "NLD"]);
const CITIES = new Set(["AMS", "RTD", "UTR", "EHV", "GRN", "HRL", "ARN", "ZWO", "LEI", "DEL", "TIL", "MST"]);

// The badge zoo. Tier and EP derive from measured probability (PROBS below).
export const BADGES = [
  // --- digits: everyday patterns ---
  { id: "even", name: "Even Steven", emoji: "⚖️", desc: "The digits form an even number.", check: (p) => parseInt(p.digits, 10) % 2 === 0 },
  { id: "odd", name: "Oddball", emoji: "🎭", desc: "The digits form an odd number.", check: (p) => parseInt(p.digits, 10) % 2 === 1 },
  { id: "haszero", name: "Zero Spotted", emoji: "🕳️", desc: "There's a 0 hiding on the plate.", check: (p) => p.digits.includes("0") },
  { id: "unique", name: "No Repeats", emoji: "❄️", desc: "Every digit is different.", check: (p) => new Set(p.digits).size === p.digits.length && p.digits.length >= 2 },
  { id: "sorted", name: "Sorted", emoji: "🪜", desc: "The digits never go down, left to right.", check: (p) => isSorted(p.digits, 1) },
  { id: "countdown", name: "Countdown", emoji: "🧨", desc: "The digits never go up, left to right.", check: (p) => isSorted(p.digits, -1) },
  { id: "sumprime", name: "Prime Sum", emoji: "➕", desc: "The digits add up to a prime number.", check: (p) => isPrime(digitSum(p.digits)) },
  { id: "sumten", name: "Perfect Ten", emoji: "🔟", desc: "The digits add up to exactly 10.", check: (p) => digitSum(p.digits) === 10 },
  { id: "alleven", name: "Even Crew", emoji: "🦾", desc: "Every single digit is even.", check: (p) => /^[02468]+$/.test(p.digits) },
  { id: "allodd", name: "Odd Squad", emoji: "🎳", desc: "Every single digit is odd.", check: (p) => /^[13579]+$/.test(p.digits) },
  { id: "prime", name: "Prime Mover", emoji: "🧮", desc: "The digits form a prime number.", check: (p) => isPrime(parseInt(p.digits, 10)) },
  { id: "eleven", name: "Elevenses", emoji: "☕", desc: "The digits are divisible by 11.", check: (p) => { const n = parseInt(p.digits, 10); return n > 0 && n % 11 === 0; } },
  // --- digits: special numbers ---
  { id: "thirteen", name: "Unlucky 13", emoji: "🐈‍⬛", desc: "The digits contain 13. Don't drive under ladders.", check: (p) => p.digits.includes("13") },
  { id: "eights", name: "Crazy Eights", emoji: "🎱", desc: "The digits contain 88.", check: (p) => p.digits.includes("88") },
  { id: "nice", name: "Nice", emoji: "😏", desc: "The digits contain 69.", check: (p) => p.digits.includes("69") },
  { id: "answer", name: "The Answer", emoji: "🐋", desc: "The digits contain 42 — life, the universe, everything.", check: (p) => p.digits.includes("42") },
  { id: "plus31", name: "+31 Represent", emoji: "📞", desc: "The digits contain 31, the Dutch dialing code.", check: (p) => p.digits.includes("31") },
  { id: "emergency", name: "Emergency!", emoji: "🚨", desc: "The digits contain 112.", check: (p) => p.digits.includes("112") },
  { id: "blazeit", name: "Blaze It", emoji: "🌿", desc: "The digits contain 420.", check: (p) => p.digits.includes("420") },
  { id: "beast", name: "Beast Mode", emoji: "😈", desc: "The digits contain 666.", check: (p) => p.digits.includes("666") },
  { id: "bond", name: "Licence to Drive", emoji: "🍸", desc: "The digits contain 007.", check: (p) => p.digits.includes("007") },
  { id: "lucky7", name: "Jackpot", emoji: "🎰", desc: "The digits contain 777.", check: (p) => p.digits.includes("777") },
  { id: "round", name: "Round Number", emoji: "⭕", desc: "The digits end in 00.", check: (p) => p.digits.endsWith("00") },
  { id: "binary", name: "Binary Build", emoji: "💾", desc: "The digits are only 0s and 1s.", check: (p) => /^[01]+$/.test(p.digits) },
  { id: "samedigits", name: "Stuck Key", emoji: "🔂", desc: "Every digit on the plate is the same.", check: (p) => allSame(p.digits) },
  { id: "straight", name: "Straight Flush", emoji: "📈", desc: "The digits run in perfect sequence, like 4-5-6.", check: (p) => isStraight(p.digits) },
  { id: "digitmirror", name: "Digit Mirror", emoji: "🔁", desc: "The digits read the same backwards.", check: (p) => p.digits.length >= 3 && p.digits === [...p.digits].reverse().join("") },
  { id: "maxed", name: "Maxed Out", emoji: "🚀", desc: "Every digit is a 7, 8 or 9.", check: (p) => /^[789]+$/.test(p.digits) },
  { id: "lowrider", name: "Low Rider", emoji: "🛹", desc: "Every digit is a 0, 1 or 2.", check: (p) => /^[012]+$/.test(p.digits) },
  // --- digits: maths club ---
  { id: "square", name: "Perfect Square", emoji: "🧮", desc: "The digits are a perfect square.", check: (p) => SQUARES.has(parseInt(p.digits, 10)) },
  { id: "cube", name: "Cubed", emoji: "🧊", desc: "The digits are a perfect cube.", check: (p) => CUBES.has(parseInt(p.digits, 10)) },
  { id: "fib", name: "Fibonacci", emoji: "🐚", desc: "The digits are a Fibonacci number.", check: (p) => FIBS.has(parseInt(p.digits, 10)) },
  { id: "pow2", name: "Power of Two", emoji: "🔋", desc: "The digits are an exact power of two.", check: (p) => POWERS_OF_TWO.has(parseInt(p.digits, 10)) },
  { id: "year", name: "Time Machine", emoji: "🕰️", desc: "The digits are a year between 1945 and 2030.", check: (p) => { const n = parseInt(p.digits, 10); return p.digits.length === 4 && n >= 1945 && n <= 2030; } },
  { id: "leet", name: "1337", emoji: "🕶️", desc: "The digits are exactly 1337. Elite.", check: (p) => p.digits === "1337" },
  // --- letters ---
  { id: "rdwok", name: "RDW Approved", emoji: "✅", desc: "No vowels — this plate could really be issued in NL.", check: (p) => ![...p.letters].some((c) => VOWELS.has(c)) },
  { id: "rdw", name: "RDW Reject", emoji: "🚓", desc: "Contains a vowel — the Dutch RDW would never issue this plate.", check: (p) => [...p.letters].some((c) => VOWELS.has(c)) },
  { id: "scrabble", name: "Scrabble Bag", emoji: "🎲", desc: "Contains a Q, X or Z — ten points, please.", check: (p) => /[QXZ]/.test(p.letters) },
  { id: "lsorted", name: "Alphabetized", emoji: "📚", desc: "The letters appear in alphabetical order.", check: (p) => isSorted(p.letters, 1) },
  { id: "ateam", name: "A-Team", emoji: "🅰️", desc: "All letters from the first half of the alphabet (A–M).", check: (p) => p.letters.length >= 2 && /^[A-M]+$/.test(p.letters) },
  { id: "zside", name: "Z-Side", emoji: "🧟", desc: "All letters from the second half of the alphabet (N–Z).", check: (p) => p.letters.length >= 2 && /^[N-Z]+$/.test(p.letters) },
  { id: "twins", name: "Twin Letters", emoji: "👯", desc: "Two identical letters sit side by side.", check: (p) => /([A-Z])\1/.test(p.letters) },
  { id: "bookends", name: "Bookends", emoji: "📕", desc: "The first and last letter are the same.", check: (p) => p.letters.length >= 3 && p.letters[0] === p.letters[p.letters.length - 1] },
  { id: "music", name: "Do Re Mi", emoji: "🎵", desc: "Every letter is a musical note (A–G).", check: (p) => p.letters.length >= 2 && /^[A-G]+$/.test(p.letters) },
  { id: "hex", name: "Hexadecimal", emoji: "🔢", desc: "Every letter is a hex digit (A–F).", check: (p) => p.letters.length >= 2 && /^[A-F]+$/.test(p.letters) },
  { id: "roman", name: "Gladiator", emoji: "🏛️", desc: "Every letter is a Roman numeral (I, V, X, L, C, D, M).", check: (p) => p.letters.length >= 2 && [...p.letters].every((c) => ROMAN.has(c)) },
  { id: "vowels", name: "Vowel Movement", emoji: "🗣️", desc: "Every letter is a vowel.", check: (p) => p.letters.length >= 2 && [...p.letters].every((c) => VOWELS.has(c)) },
  { id: "ev", name: "Goes Electric", emoji: "⚡", desc: "The letters contain EV.", check: (p) => p.letters.includes("EV") },
  { id: "triple", name: "Triple Threat", emoji: "🎺", desc: "Three or more identical letters.", check: (p) => p.letters.length >= 3 && allSame(p.letters) },
  { id: "abc", name: "Alphabet Soup", emoji: "🍜", desc: "Three or more letters in alphabetical sequence, like A-B-C.", check: (p) => p.letters.length >= 3 && isStraight(p.letters) },
  { id: "word", name: "Wordsmith", emoji: "📖", desc: "The letters spell an actual word.", check: (p) => WORDS3.has(p.letters) || WORDS2.has(p.letters) },
  { id: "meme", name: "Certified Meme", emoji: "🤣", desc: "The letters spell internet gold.", check: (p) => MEMES.has(p.letters) },
  { id: "city", name: "City Trip", emoji: "🏙️", desc: "The letters are a Dutch city code.", check: (p) => CITIES.has(p.letters) },
  { id: "agency", name: "Undercover", emoji: "🕵️", desc: "The letters spell a three-letter agency.", check: (p) => AGENCIES.has(p.letters) },
  { id: "dutch", name: "Oranje Boven", emoji: "🧀", desc: "The letters spell NL or NLD.", check: (p) => DUTCH.has(p.letters) },
  { id: "founder", name: "Founder's Plate", emoji: "👑", desc: "The letters are FW. The maker of this site approves.", check: (p) => p.letters === "FW" },
  // --- whole plate ---
  { id: "modern", name: "Fresh Plates", emoji: "✨", desc: "One of the newest sidecode formats.", check: (p) => p.sc >= 9 },
  { id: "classic", name: "Classic Lines", emoji: "🎩", desc: "A 1960s/70s sidecode format.", check: (p) => p.sc === 3 || p.sc === 4 },
  { id: "oldtimer", name: "Oldtimer", emoji: "🦖", desc: "A 1950s sidecode — plates this old barely exist anymore.", check: (p) => p.sc <= 2 },
  { id: "spotdiff", name: "Spot the Difference", emoji: "👀", desc: "Has both the letter O and the digit 0. Confusing.", check: (p) => p.letters.includes("O") && p.digits.includes("0") },
  { id: "dejavu", name: "Déjà Vu", emoji: "🌀", desc: "Two groups on the plate are identical.", check: (p) => p.groups.some((g, i) => p.groups.some((h, j) => i < j && g === h)) },
  { id: "palindrome", name: "Mirror Mirror", emoji: "🪞", desc: "The whole plate reads the same backwards.", check: (p) => p.alnum === [...p.alnum].reverse().join("") },
];

export const TIERS = [
  { id: "common", name: "Common", ep: 250, min: 0.10 },
  { id: "uncommon", name: "Uncommon", ep: 1000, min: 0.01 },
  { id: "rare", name: "Rare", ep: 5000, min: 0.001 },
  { id: "epic", name: "Epic", ep: 25000, min: 0.0001 },
  { id: "legendary", name: "Legendary", ep: 100000, min: 0.00001 },
  { id: "mythic", name: "Mythic", ep: 500000, min: 0 },
];

export function badgeTier(badge) {
  const prob = PROBS[badge.id] ?? 0;
  return TIERS.find((t) => prob >= t.min) ?? TIERS[TIERS.length - 1];
}

export function scorePlate(plate) {
  const badges = BADGES.filter((b) => b.check(plate));
  const ep = badges.reduce((sum, b) => sum + badgeTier(b).ep, 0);
  return { badges, ep };
}

// Card rarity: where does this roll's EP sit among all possible rolls?
export const CARD_TIERS = [
  { id: "mythic", name: "Mythic", min: 0.99 },
  { id: "legendary", name: "Legendary", min: 0.95 },
  { id: "epic", name: "Epic", min: 0.85 },
  { id: "rare", name: "Rare", min: 0.65 },
  { id: "uncommon", name: "Uncommon", min: 0.40 },
  { id: "common", name: "Common", min: 0.01 },
  { id: "trash", name: "Trash", min: 0 },
];

export function cardPercentile(ep, samples = 3000, rng = Math.random) {
  let below = 0, equal = 0;
  for (let i = 0; i < samples; i++) {
    const other = scorePlate(generatePlate(rng)).ep;
    if (other < ep) below++;
    else if (other === ep) equal++;
  }
  return (below + equal / 2) / samples;
}

export function cardTier(pct) {
  return CARD_TIERS.find((t) => pct >= t.min) ?? CARD_TIERS[CARD_TIERS.length - 1];
}

// Empirical probability of each badge per roll, measured over a
// 2,000,000-roll simulation (regenerate by running this file's sibling
// calibration snippet — see git history / commit message).
export const PROBS = {
  even: 5.01e-1,
  odd: 4.99e-1,
  haszero: 2.54e-1,
  unique: 7.56e-1,
  sorted: 2.97e-1,
  countdown: 2.97e-1,
  sumprime: 3.46e-1,
  sumten: 6.83e-2,
  alleven: 1.54e-1,
  allodd: 1.54e-1,
  prime: 1.87e-1,
  eleven: 9.01e-2,
  thirteen: 1.79e-2,
  eights: 1.71e-2,
  nice: 1.78e-2,
  answer: 1.79e-2,
  plus31: 1.79e-2,
  emergency: 8.27e-4,
  blazeit: 8.01e-4,
  beast: 7.82e-4,
  bond: 7.85e-4,
  lucky7: 7.99e-4,
  round: 9.96e-3,
  binary: 1.57e-2,
  samedigits: 3.22e-2,
  straight: 1.14e-2,
  digitmirror: 7.14e-2,
  maxed: 4.19e-2,
  lowrider: 4.21e-2,
  square: 4.17e-2,
  cube: 9.97e-3,
  fib: 1.95e-2,
  pow2: 1.18e-2,
  year: 3.35e-4,
  leet: 2.00e-6,
  rdwok: 5.07e-1,
  rdw: 4.93e-1,
  scrabble: 3.25e-1,
  lsorted: 1.66e-1,
  ateam: 1.14e-1,
  zside: 1.14e-1,
  twins: 8.29e-2,
  bookends: 3.69e-2,
  music: 1.79e-2,
  hex: 1.15e-2,
  roman: 1.81e-2,
  vowels: 6.91e-3,
  ev: 3.18e-3,
  triple: 1.08e-3,
  abc: 1.98e-3,
  word: 1.12e-2,
  meme: 1.11e-3,
  city: 4.77e-4,
  agency: 2.72e-4,
  dutch: 9.95e-5,
  founder: 5.10e-5,
  modern: 3.70e-1,
  classic: 7.04e-2,
  oldtimer: 2.00e-2,
  spotdiff: 2.93e-2,
  dejavu: 7.36e-4,
  palindrome: 1.30e-5,
};
