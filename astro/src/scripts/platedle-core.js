// Platedle core game logic. Pure JS (no DOM) so it can also be run under
// node for probability calibration (see prob values on each badge).

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
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generatePlate(rng = Math.random) {
  let pick = rng() * TOTAL_WEIGHT;
  let side = SIDECODES[SIDECODES.length - 1];
  for (const s of SIDECODES) {
    pick -= s.weight;
    if (pick < 0) { side = s; break; }
  }
  let text = "";
  for (const ch of side.fmt) {
    if (ch === "X") text += LETTERS[Math.floor(rng() * 26)];
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

function allSame(s) {
  return s.length >= 2 && [...s].every((c) => c === s[0]);
}

const POWERS_OF_TWO = new Set([16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]);
const VOWELS = new Set("AEIOU");
const WORDS = new Set([
  "ACE","APE","ARM","ART","BAD","BAG","BAR","BAT","BED","BEE","BIG","BOX","BOY","BUS",
  "CAB","CAR","CAT","COW","CUP","DAD","DAY","DOG","EAR","EGG","END","EYE","FAN","FAT",
  "FIX","FLY","FOX","FUN","GAS","GEM","GUM","GUN","GUY","HAM","HAT","HEN","HIP","HIT",
  "HOT","ICE","INK","JAM","JET","JOB","JOY","KEY","KID","LAW","LEG","LIP","LOG","LOW",
  "MAD","MAP","MAX","MEN","MIX","MOM","MUD","NET","NEW","NUT","OAK","ODD","OIL","OLD",
  "ONE","OWL","PAN","PEN","PET","PIE","PIG","PIN","POP","POT","PRO","RAT","RAW","RED",
  "RIB","ROW","RUG","RUM","RUN","SAD","SEA","SIX","SKY","SON","SPA","SUN","TAX","TEA",
  "TEN","TIP","TOE","TOP","TOY","VAN","WAR","WAX","WEB","WET","WIG","WIN","YES","ZIP",
  "ZOO","AAP","KIP","KAT","PSV","AJX",
]);
const MEMES = new Set([
  "LOL","WTF","OMG","FML","KEK","SUS","UWU","BRB","IRL","SOS","VIP","UFO","DNA",
  "XD","GG","EZ","OP","AI","OK",
]);
const AGENCIES = new Set(["FBI", "CIA", "KGB", "NSA", "FSB", "DEA", "ATF", "AIVD"]);
const DUTCH = new Set(["NL", "NLD"]);

// prob = empirical probability per roll, measured over a 2,000,000-roll
// simulation (scripts/calibrate.mjs). Tier and EP are derived from it.
export const BADGES = [
  { id: "prime", name: "Prime Mover", emoji: "🧮", desc: "The digits form a prime number.", prob: 0.187, check: (p) => isPrime(parseInt(p.digits, 10)) },
  { id: "rdw", name: "RDW Reject", emoji: "🚓", desc: "Contains a vowel — the Dutch RDW would never issue this plate.", prob: 0.493, check: (p) => [...p.letters].some((c) => VOWELS.has(c)) },
  { id: "nice", name: "Nice", emoji: "😏", desc: "The digits contain 69.", prob: 0.0179, check: (p) => p.digits.includes("69") },
  { id: "answer", name: "The Answer", emoji: "🐋", desc: "The digits contain 42 — life, the universe, everything.", prob: 0.018, check: (p) => p.digits.includes("42") },
  { id: "blazeit", name: "Blaze It", emoji: "🌿", desc: "The digits contain 420.", prob: 0.00079, check: (p) => p.digits.includes("420") },
  { id: "beast", name: "Beast Mode", emoji: "😈", desc: "The digits contain 666.", prob: 0.00077, check: (p) => p.digits.includes("666") },
  { id: "bond", name: "Licence to Drive", emoji: "🍸", desc: "The digits contain 007.", prob: 0.00079, check: (p) => p.digits.includes("007") },
  { id: "lucky7", name: "Jackpot", emoji: "🎰", desc: "The digits contain 777.", prob: 0.00078, check: (p) => p.digits.includes("777") },
  { id: "samedigits", name: "Stuck Key", emoji: "🔂", desc: "Every digit on the plate is the same.", prob: 0.032, check: (p) => allSame(p.digits) },
  { id: "straight", name: "Straight Flush", emoji: "📈", desc: "The digits run in perfect sequence, like 4-5-6.", prob: 0.0114, check: (p) => isStraight(p.digits) },
  { id: "round", name: "Round Number", emoji: "⭕", desc: "The digits end in 00.", prob: 0.0100, check: (p) => p.digits.endsWith("00") },
  { id: "binary", name: "Binary Build", emoji: "💾", desc: "The digits are only 0s and 1s.", prob: 0.0158, check: (p) => /^[01]+$/.test(p.digits) },
  { id: "pow2", name: "Power of Two", emoji: "🔋", desc: "The digits are an exact power of two.", prob: 0.0117, check: (p) => POWERS_OF_TWO.has(parseInt(p.digits, 10)) },
  { id: "leet", name: "1337", emoji: "🕶️", desc: "The digits are exactly 1337. Elite.", prob: 0.0000045, check: (p) => p.digits === "1337" },
  { id: "twins", name: "Twin Letters", emoji: "👯", desc: "Two identical letters sit side by side.", prob: 0.0827, check: (p) => /([A-Z])\1/.test(p.letters) },
  { id: "triple", name: "Triple Threat", emoji: "🎺", desc: "Three or more identical letters.", prob: 0.00108, check: (p) => p.letters.length >= 3 && allSame(p.letters) },
  { id: "abc", name: "Alphabet Soup", emoji: "🍜", desc: "Three or more letters in alphabetical sequence, like A-B-C.", prob: 0.00193, check: (p) => p.letters.length >= 3 && isStraight(p.letters) },
  { id: "word", name: "Wordsmith", emoji: "📖", desc: "The letters spell an actual word.", prob: 0.00474, check: (p) => WORDS.has(p.letters) },
  { id: "meme", name: "Certified Meme", emoji: "🤣", desc: "The letters spell internet gold.", prob: 0.00086, check: (p) => MEMES.has(p.letters) },
  { id: "agency", name: "Undercover", emoji: "🕵️", desc: "The letters spell a three-letter agency.", prob: 0.00028, check: (p) => AGENCIES.has(p.letters) },
  { id: "dutch", name: "Oranje Boven", emoji: "🧀", desc: "The letters spell NL or NLD.", prob: 0.00009, check: (p) => DUTCH.has(p.letters) },
  { id: "vowels", name: "Vowel Movement", emoji: "🗣️", desc: "Every letter is a vowel.", prob: 0.0068, check: (p) => p.letters.length >= 2 && [...p.letters].every((c) => VOWELS.has(c)) },
  { id: "palindrome", name: "Mirror Mirror", emoji: "🪞", desc: "The whole plate reads the same backwards.", prob: 0.000014, check: (p) => p.alnum === [...p.alnum].reverse().join("") },
  { id: "oldtimer", name: "Oldtimer", emoji: "🦖", desc: "A 1950s sidecode — plates this old barely exist anymore.", prob: 0.020, check: (p) => p.sc <= 2 },
  { id: "dejavu", name: "Déjà Vu", emoji: "🌀", desc: "Two groups on the plate are identical.", prob: 0.00074, check: (p) => p.groups.some((g, i) => p.groups.some((h, j) => i < j && g === h)) },
];

export const TIERS = [
  { id: "common", name: "Common", ep: 1, min: 0.10 },
  { id: "uncommon", name: "Uncommon", ep: 5, min: 0.01 },
  { id: "rare", name: "Rare", ep: 25, min: 0.001 },
  { id: "epic", name: "Epic", ep: 100, min: 0.0001 },
  { id: "legendary", name: "Legendary", ep: 500, min: 0.00001 },
  { id: "mythic", name: "Mythic", ep: 2500, min: 0 },
];

export function badgeTier(badge) {
  return TIERS.find((t) => badge.prob >= t.min) ?? TIERS[TIERS.length - 1];
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
