// Platedle core game logic. Pure JS (no DOM) so it can also be run under
// node for probability calibration (see PROBS at the bottom).

// ---------------------------------------------------------------------------
// Regions: every country rolls its own plate format and visual style.
// Weights are relative; NL is home base, micro-states are jackpot territory.
// Style fields: bg/fg (CSS colors), euband (EU-style blue side band text),
// top (banner text above the characters, "STATE" = the rolled US state name).
// ---------------------------------------------------------------------------

export const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
];
const US_FMTS = ["XXX-9999", "9XXX999", "XXX 9999", "999-XXX", "XX-99999"];
const US_COLORS = [
  { bg: "#ffffff", fg: "#1d4ed8" },
  { bg: "#fffbe6", fg: "#b91c1c" },
  { bg: "#f0f9ff", fg: "#0f766e" },
  { bg: "#ffffff", fg: "#16181d" },
];

const DE_CITIES = ["B","M","K","F","S","D","HH","HB","H","N","L","DD","MD","P","BO","DO","E","W","MS","A","R","UL","HD","FR","KA","WI","MA","AC","BN","ES"];
const CH_CANTONS = ["ZH","BE","LU","UR","SZ","OW","NW","GL","ZG","FR","SO","BS","BL","SH","AR","AI","SG","GR","AG","TG","TI","VD","VS","NE","GE","JU"];

const NL_SIDECODES = [
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
export const SIDECODES = NL_SIDECODES;

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function pickWeighted(items, rng, weightOf = (x) => x.weight) {
  const total = items.reduce((a, x) => a + weightOf(x), 0);
  let pick = rng() * total;
  for (const x of items) {
    pick -= weightOf(x);
    if (pick < 0) return x;
  }
  return items[items.length - 1];
}
const pickFrom = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

// "X" = random letter, "9" = random digit, anything else is literal.
function fromFmt(fmt, rng) {
  let text = "";
  for (const ch of fmt) {
    if (ch === "X") text += ALPHABET[Math.floor(rng() * 26)];
    else if (ch === "9") text += Math.floor(rng() * 10);
    else text += ch;
  }
  return text;
}
const digitsOf = (rng, n, noLeadZero = false) =>
  Array.from({ length: n }, (_, i) => (i === 0 && noLeadZero ? randInt(rng, 1, 9) : randInt(rng, 0, 9))).join("");
const lettersOf = (rng, n) => Array.from({ length: n }, () => ALPHABET[Math.floor(rng() * 26)]).join("");

export const REGIONS = [
  { id: "nl", name: "Netherlands", flag: "🇳🇱", weight: 40, euband: "NL", bg: "linear-gradient(180deg,#fdc500,#f4af00)", fg: "#111",
    gen: (rng) => { const side = pickWeighted(NL_SIDECODES, rng); return { text: fromFmt(side.fmt, rng), sc: side.sc }; } },
  { id: "de", name: "Germany", flag: "🇩🇪", weight: 8, euband: "D", bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(DE_CITIES, rng)}-${lettersOf(rng, randInt(rng, 1, 2))} ${digitsOf(rng, randInt(rng, 1, 4), true)}` }) },
  { id: "us", name: "United States", flag: "🇺🇸", weight: 8, top: "STATE",
    gen: (rng) => { const i = Math.floor(rng() * US_STATES.length); return { text: fromFmt(US_FMTS[i % US_FMTS.length], rng), state: US_STATES[i][0], ...US_COLORS[i % US_COLORS.length] }; } },
  { id: "be", name: "Belgium", flag: "🇧🇪", weight: 6, euband: "B", bg: "#ffffff", fg: "#a31621", fmt: "9-XXX-999" },
  { id: "fr", name: "France", flag: "🇫🇷", weight: 5, euband: "F", bg: "#ffffff", fg: "#16181d", fmt: "XX-999-XX" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", weight: 5, euband: "GB", bg: "linear-gradient(180deg,#fde047,#facc15)", fg: "#16181d", fmt: "XX99 XXX" },
  { id: "it", name: "Italy", flag: "🇮🇹", weight: 4, euband: "I", bg: "#ffffff", fg: "#16181d", fmt: "XX 999XX" },
  { id: "es", name: "Spain", flag: "🇪🇸", weight: 4, euband: "E", bg: "#ffffff", fg: "#16181d", fmt: "9999 XXX" },
  { id: "pl", name: "Poland", flag: "🇵🇱", weight: 3, euband: "PL", bg: "#ffffff", fg: "#16181d", fmt: "XX 99999" },
  { id: "se", name: "Sweden", flag: "🇸🇪", weight: 2, euband: "S", bg: "#ffffff", fg: "#16181d", fmt: "XXX 999" },
  { id: "ch", name: "Switzerland", flag: "🇨🇭", weight: 2, bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(CH_CANTONS, rng)} ${digitsOf(rng, randInt(rng, 3, 6), true)}` }) },
  { id: "at", name: "Austria", flag: "🇦🇹", weight: 2, euband: "A", bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(["W","G","L","S","I","K"], rng)}-${digitsOf(rng, randInt(rng, 3, 4), true)} ${lettersOf(rng, randInt(rng, 1, 2))}` }) },
  { id: "jp", name: "Japan", flag: "🇯🇵", weight: 2, top: "JAPAN", bg: "#ffffff", fg: "#15803d", fmt: "999 99-99" },
  { id: "au", name: "Australia", flag: "🇦🇺", weight: 1.5, top: "AUSTRALIA", bg: "#16181d", fg: "#fbbf24", fmt: "XXX-999" },
  { id: "ca", name: "Canada", flag: "🇨🇦", weight: 1.5, top: "CANADA", bg: "#ffffff", fg: "#1e40af", fmt: "XXXX 999" },
  { id: "no", name: "Norway", flag: "🇳🇴", weight: 1.5, euband: "N", bg: "#ffffff", fg: "#16181d", fmt: "XX 99999" },
  { id: "dk", name: "Denmark", flag: "🇩🇰", weight: 1.5, euband: "DK", bg: "#ffffff", fg: "#16181d", fmt: "XX 99 999" },
  { id: "lu", name: "Luxembourg", flag: "🇱🇺", weight: 1, euband: "L", bg: "linear-gradient(180deg,#fdc500,#f4af00)", fg: "#111", fmt: "XX 9999" },
  { id: "fi", name: "Finland", flag: "🇫🇮", weight: 1, euband: "FIN", bg: "#ffffff", fg: "#16181d", fmt: "XXX-999" },
  { id: "gr", name: "Greece", flag: "🇬🇷", weight: 1, euband: "GR", bg: "#ffffff", fg: "#16181d", fmt: "XXX-9999" },
  { id: "pt", name: "Portugal", flag: "🇵🇹", weight: 1, euband: "P", bg: "#ffffff", fg: "#16181d", fmt: "99-XX-99" },
  { id: "cz", name: "Czechia", flag: "🇨🇿", weight: 1, euband: "CZ", bg: "#ffffff", fg: "#16181d", fmt: "9X9 9999" },
  { id: "ie", name: "Ireland", flag: "🇮🇪", weight: 1, euband: "IRL", bg: "#ffffff", fg: "#16181d", fmt: "99-X-9999" },
  { id: "tr", name: "Türkiye", flag: "🇹🇷", weight: 1, euband: "TR", bg: "#ffffff", fg: "#16181d", fmt: "99 XX 999" },
  { id: "in", name: "India", flag: "🇮🇳", weight: 1, euband: "IND", bg: "#ffffff", fg: "#16181d", fmt: "XX 99 XX 9999" },
  { id: "br", name: "Brazil", flag: "🇧🇷", weight: 1, top: "BRASIL", bg: "#ffffff", fg: "#16181d", fmt: "XXX9X99" },
  { id: "mx", name: "Mexico", flag: "🇲🇽", weight: 0.8, top: "MÉXICO", bg: "#ffffff", fg: "#166534", fmt: "XXX-99-99" },
  { id: "cn", name: "China", flag: "🇨🇳", weight: 0.8, bg: "#1557c4", fg: "#ffffff", fmt: "X 99999" },
  { id: "za", name: "South Africa", flag: "🇿🇦", weight: 0.6, top: "SOUTH AFRICA", bg: "#ffffff", fg: "#16181d", fmt: "XXX 999 GP" },
  { id: "ae", name: "Dubai (UAE)", flag: "🇦🇪", weight: 0.5, top: "DUBAI", bg: "#ffffff", fg: "#16181d", fmt: "X 99999" },
  { id: "nz", name: "New Zealand", flag: "🇳🇿", weight: 0.5, top: "NEW ZEALAND", bg: "#ffffff", fg: "#16181d", fmt: "XXX999" },
  { id: "is", name: "Iceland", flag: "🇮🇸", weight: 0.4, euband: "IS", bg: "#ffffff", fg: "#16181d", fmt: "XX-X99" },
  { id: "mc", name: "Monaco", flag: "🇲🇨", weight: 0.3, top: "MONACO", bg: "#ffffff", fg: "#1e40af", fmt: "9999" },
  { id: "sm", name: "San Marino", flag: "🇸🇲", weight: 0.2, top: "SAN MARINO", bg: "#ffffff", fg: "#0369a1", fmt: "X9999" },
  { id: "li", name: "Liechtenstein", flag: "🇱🇮", weight: 0.2, bg: "#16181d", fg: "#ffffff", fmt: "FL 99999" },
  { id: "va", name: "Vatican City", flag: "🇻🇦", weight: 0.1, top: "VATICANO", bg: "#ffffff", fg: "#16181d", fmt: "SCV 999" },
];
export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
export const US_STATE_NAMES = Object.fromEntries(US_STATES);

// Visual spec for rendering a plate of a given region (and US state).
export function plateStyle(regionId, state) {
  const r = REGION_BY_ID[regionId] ?? REGION_BY_ID.nl;
  let bg = r.bg ?? "#ffffff";
  let fg = r.fg ?? "#16181d";
  const top = r.top === "STATE" ? (US_STATE_NAMES[state] ?? "USA").toUpperCase() : r.top ?? null;
  if (regionId === "us" && state) {
    const i = US_STATES.findIndex(([ab]) => ab === state);
    if (i >= 0) ({ bg, fg } = US_COLORS[i % US_COLORS.length]);
  }
  return { bg, fg, top, band: r.euband ?? null };
}

export function generatePlate(rng = Math.random) {
  const region = pickWeighted(REGIONS, rng);
  const out = region.gen ? region.gen(rng) : { text: fromFmt(region.fmt, rng) };
  return describePlate(out.text, { region: region.id, sc: out.sc ?? 0, state: out.state ?? null });
}

export function describePlate(text, meta = {}) {
  const alnum = text.replace(/[^A-Z0-9]/g, "");
  const letters = alnum.replace(/[0-9]/g, "");
  const digits = alnum.replace(/[A-Z]/g, "");
  return {
    text,
    region: meta.region ?? "nl",
    sc: meta.sc ?? 0,
    state: meta.state ?? null,
    alnum,
    letters,
    digits,
    groups: text.split(/[-\s]/),
  };
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
const SQUARES = new Set(Array.from({ length: 98 }, (_, i) => (i + 2) ** 2).filter((n) => n <= 99999));
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
// cat: "pattern" (default), "country" or "state" — used to group the collection.
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
  { id: "rdwok", name: "RDW Approved", emoji: "✅", desc: "A Dutch plate with no vowels — this one could really be issued.", check: (p) => p.region === "nl" && ![...p.letters].some((c) => VOWELS.has(c)) },
  { id: "rdw", name: "RDW Reject", emoji: "🚓", desc: "A Dutch plate with a vowel — the RDW would never issue this.", check: (p) => p.region === "nl" && [...p.letters].some((c) => VOWELS.has(c)) },
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
  { id: "modern", name: "Fresh Plates", emoji: "✨", desc: "One of the newest Dutch sidecode formats.", check: (p) => p.region === "nl" && p.sc >= 9 },
  { id: "classic", name: "Classic Lines", emoji: "🎩", desc: "A 1960s/70s Dutch sidecode format.", check: (p) => p.region === "nl" && (p.sc === 3 || p.sc === 4) },
  { id: "oldtimer", name: "Oldtimer", emoji: "🦖", desc: "A 1950s Dutch sidecode — plates this old barely exist anymore.", check: (p) => p.region === "nl" && p.sc <= 2 && p.sc > 0 },
  { id: "spotdiff", name: "Spot the Difference", emoji: "👀", desc: "Has both the letter O and the digit 0. Confusing.", check: (p) => p.letters.includes("O") && p.digits.includes("0") },
  { id: "dejavu", name: "Déjà Vu", emoji: "🌀", desc: "Two groups on the plate are identical.", check: (p) => p.groups.some((g, i) => p.groups.some((h, j) => i < j && g === h)) },
  { id: "palindrome", name: "Mirror Mirror", emoji: "🪞", desc: "The whole plate reads the same backwards.", check: (p) => p.alnum === [...p.alnum].reverse().join("") },
  // --- the mythics ---
  { id: "popemobile", name: "Popemobile", emoji: "⛪", desc: "Vatican plate SCV 001. His Holiness rides shotgun.", check: (p) => p.region === "va" && p.digits === "001" },
  { id: "sevens5", name: "Slot Machine God", emoji: "🍀", desc: "The digits are 77777. Go buy a lottery ticket.", check: (p) => p.digits === "77777" },
];

// One badge per country, plus one per US state. Rarity follows roll weight.
for (const r of REGIONS) {
  BADGES.push({
    id: `cc-${r.id}`, cat: "country", name: r.name, emoji: r.flag,
    desc: `Rolled a plate from ${r.name}.`,
    check: (p) => p.region === r.id,
  });
}
for (const [ab, name] of US_STATES) {
  BADGES.push({
    id: `us-${ab}`, cat: "state", name, emoji: "🇺🇸",
    desc: `Rolled a ${name} plate.`,
    check: (p) => p.region === "us" && p.state === ab,
  });
}

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

// Empirical probability of each badge per roll, measured by simulation.
export const PROBS = {
  "even": 4.98e-1,
  "odd": 5.02e-1,
  "haszero": 2.86e-1,
  "unique": 6.18e-1,
  "sorted": 2.03e-1,
  "countdown": 2.08e-1,
  "sumprime": 3.26e-1,
  "sumten": 5.04e-2,
  "alleven": 1.21e-1,
  "allodd": 1.26e-1,
  "prime": 1.64e-1,
  "eleven": 8.89e-2,
  "thirteen": 2.39e-2,
  "eights": 2.24e-2,
  "nice": 2.37e-2,
  "answer": 2.41e-2,
  "plus31": 2.39e-2,
  "emergency": 1.38e-3,
  "blazeit": 1.42e-3,
  "beast": 1.39e-3,
  "bond": 1.34e-3,
  "lucky7": 1.33e-3,
  "round": 9.76e-3,
  "binary": 1.20e-2,
  "samedigits": 2.07e-2,
  "straight": 7.73e-3,
  "digitmirror": 4.92e-2,
  "maxed": 3.48e-2,
  "lowrider": 3.19e-2,
  "square": 3.18e-2,
  "cube": 6.79e-3,
  "fib": 1.28e-2,
  "pow2": 7.62e-3,
  "year": 1.99e-3,
  "leet": 2.67e-5,
  "rdwok": 1.84e-1,
  "rdw": 1.79e-1,
  "scrabble": 2.91e-1,
  "lsorted": 1.97e-1,
  "ateam": 1.27e-1,
  "zside": 1.12e-1,
  "twins": 7.94e-2,
  "bookends": 3.04e-2,
  "music": 2.36e-2,
  "hex": 1.52e-2,
  "roman": 2.21e-2,
  "vowels": 9.36e-3,
  "ev": 2.95e-3,
  "triple": 8.49e-4,
  "abc": 1.41e-3,
  "word": 1.41e-2,
  "meme": 2.87e-3,
  "city": 3.53e-4,
  "agency": 1.98e-4,
  "dutch": 2.37e-4,
  "founder": 2.23e-4,
  "modern": 1.34e-1,
  "classic": 2.52e-2,
  "oldtimer": 7.19e-3,
  "spotdiff": 2.98e-2,
  "dejavu": 1.77e-3,
  "palindrome": 7.53e-5,
  "popemobile": 8.9e-7,
  "sevens5": 6.4e-7,
  "cc-nl": 3.63e-1,
  "cc-de": 7.25e-2,
  "cc-us": 7.23e-2,
  "cc-be": 5.45e-2,
  "cc-fr": 4.52e-2,
  "cc-uk": 4.53e-2,
  "cc-it": 3.61e-2,
  "cc-es": 3.62e-2,
  "cc-pl": 2.70e-2,
  "cc-se": 1.80e-2,
  "cc-ch": 1.82e-2,
  "cc-at": 1.80e-2,
  "cc-jp": 1.81e-2,
  "cc-au": 1.34e-2,
  "cc-ca": 1.35e-2,
  "cc-no": 1.35e-2,
  "cc-dk": 1.37e-2,
  "cc-lu": 9.11e-3,
  "cc-fi": 9.19e-3,
  "cc-gr": 9.12e-3,
  "cc-pt": 9.01e-3,
  "cc-cz": 9.17e-3,
  "cc-ie": 9.20e-3,
  "cc-tr": 8.94e-3,
  "cc-in": 9.05e-3,
  "cc-br": 9.07e-3,
  "cc-mx": 7.31e-3,
  "cc-cn": 7.20e-3,
  "cc-za": 5.48e-3,
  "cc-ae": 4.46e-3,
  "cc-nz": 4.43e-3,
  "cc-is": 3.64e-3,
  "cc-mc": 2.77e-3,
  "cc-sm": 1.81e-3,
  "cc-li": 1.82e-3,
  "cc-va": 8.92e-4,
  "us-AL": 1.47e-3,
  "us-AK": 1.45e-3,
  "us-AZ": 1.43e-3,
  "us-AR": 1.46e-3,
  "us-CA": 1.43e-3,
  "us-CO": 1.43e-3,
  "us-CT": 1.50e-3,
  "us-DE": 1.47e-3,
  "us-FL": 1.43e-3,
  "us-GA": 1.41e-3,
  "us-HI": 1.45e-3,
  "us-ID": 1.44e-3,
  "us-IL": 1.47e-3,
  "us-IN": 1.47e-3,
  "us-IA": 1.48e-3,
  "us-KS": 1.46e-3,
  "us-KY": 1.44e-3,
  "us-LA": 1.43e-3,
  "us-ME": 1.44e-3,
  "us-MD": 1.42e-3,
  "us-MA": 1.51e-3,
  "us-MI": 1.44e-3,
  "us-MN": 1.42e-3,
  "us-MS": 1.43e-3,
  "us-MO": 1.51e-3,
  "us-MT": 1.42e-3,
  "us-NE": 1.45e-3,
  "us-NV": 1.48e-3,
  "us-NH": 1.39e-3,
  "us-NJ": 1.48e-3,
  "us-NM": 1.45e-3,
  "us-NY": 1.48e-3,
  "us-NC": 1.46e-3,
  "us-ND": 1.44e-3,
  "us-OH": 1.39e-3,
  "us-OK": 1.43e-3,
  "us-OR": 1.45e-3,
  "us-PA": 1.43e-3,
  "us-RI": 1.40e-3,
  "us-SC": 1.49e-3,
  "us-SD": 1.47e-3,
  "us-TN": 1.45e-3,
  "us-TX": 1.49e-3,
  "us-UT": 1.46e-3,
  "us-VT": 1.45e-3,
  "us-VA": 1.42e-3,
  "us-WA": 1.44e-3,
  "us-WV": 1.42e-3,
  "us-WI": 1.42e-3,
  "us-WY": 1.39e-3,
};
