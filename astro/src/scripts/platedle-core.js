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
  { id: "nl", name: "Netherlands", flag: "🇳🇱", weight: 2, euband: "NL", bg: "linear-gradient(180deg,#fdc500,#f4af00)", fg: "#111",
    gen: (rng) => { const side = pickWeighted(NL_SIDECODES, rng); return { text: fromFmt(side.fmt, rng), sc: side.sc }; } },
  { id: "de", name: "Germany", flag: "🇩🇪", weight: 9, euband: "D", bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(DE_CITIES, rng)}-${lettersOf(rng, randInt(rng, 1, 2))} ${digitsOf(rng, randInt(rng, 1, 4), true)}` }) },
  { id: "us", name: "United States", flag: "🇺🇸", weight: 14, top: "STATE",
    gen: (rng) => { const i = Math.floor(rng() * US_STATES.length); return { text: fromFmt(US_FMTS[i % US_FMTS.length], rng), state: US_STATES[i][0], ...US_COLORS[i % US_COLORS.length] }; } },
  { id: "be", name: "Belgium", flag: "🇧🇪", weight: 3, euband: "B", bg: "#ffffff", fg: "#a31621", fmt: "9-XXX-999" },
  { id: "fr", name: "France", flag: "🇫🇷", weight: 7, euband: "F", bg: "#ffffff", fg: "#16181d", fmt: "XX-999-XX" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", weight: 8, euband: "GB", bg: "linear-gradient(180deg,#fde047,#facc15)", fg: "#16181d", fmt: "XX99 XXX" },
  { id: "it", name: "Italy", flag: "🇮🇹", weight: 6, euband: "I", bg: "#ffffff", fg: "#16181d", fmt: "XX 999XX" },
  { id: "es", name: "Spain", flag: "🇪🇸", weight: 5, euband: "E", bg: "#ffffff", fg: "#16181d", fmt: "9999 XXX" },
  { id: "pl", name: "Poland", flag: "🇵🇱", weight: 3, euband: "PL", bg: "#ffffff", fg: "#16181d", fmt: "XX 99999" },
  { id: "se", name: "Sweden", flag: "🇸🇪", weight: 2, euband: "S", bg: "#ffffff", fg: "#16181d", fmt: "XXX 999" },
  { id: "ch", name: "Switzerland", flag: "🇨🇭", weight: 2, bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(CH_CANTONS, rng)} ${digitsOf(rng, randInt(rng, 3, 6), true)}` }) },
  { id: "at", name: "Austria", flag: "🇦🇹", weight: 2, euband: "A", bg: "#ffffff", fg: "#16181d",
    gen: (rng) => ({ text: `${pickFrom(["W","G","L","S","I","K"], rng)}-${digitsOf(rng, randInt(rng, 3, 4), true)} ${lettersOf(rng, randInt(rng, 1, 2))}` }) },
  { id: "jp", name: "Japan", flag: "🇯🇵", weight: 5, top: "JAPAN", bg: "#ffffff", fg: "#15803d", fmt: "999 99-99" },
  { id: "au", name: "Australia", flag: "🇦🇺", weight: 4, top: "AUSTRALIA", bg: "#16181d", fg: "#fbbf24", fmt: "XXX-999" },
  { id: "ca", name: "Canada", flag: "🇨🇦", weight: 4, top: "CANADA", bg: "#ffffff", fg: "#1e40af", fmt: "XXXX 999" },
  { id: "no", name: "Norway", flag: "🇳🇴", weight: 2, euband: "N", bg: "#ffffff", fg: "#16181d", fmt: "XX 99999" },
  { id: "dk", name: "Denmark", flag: "🇩🇰", weight: 2, euband: "DK", bg: "#ffffff", fg: "#16181d", fmt: "XX 99 999" },
  { id: "lu", name: "Luxembourg", flag: "🇱🇺", weight: 0.8, euband: "L", bg: "linear-gradient(180deg,#fdc500,#f4af00)", fg: "#111", fmt: "XX 9999" },
  { id: "fi", name: "Finland", flag: "🇫🇮", weight: 2, euband: "FIN", bg: "#ffffff", fg: "#16181d", fmt: "XXX-999" },
  { id: "gr", name: "Greece", flag: "🇬🇷", weight: 2, euband: "GR", bg: "#ffffff", fg: "#16181d", fmt: "XXX-9999" },
  { id: "pt", name: "Portugal", flag: "🇵🇹", weight: 2, euband: "P", bg: "#ffffff", fg: "#16181d", fmt: "99-XX-99" },
  { id: "cz", name: "Czechia", flag: "🇨🇿", weight: 2, euband: "CZ", bg: "#ffffff", fg: "#16181d", fmt: "9X9 9999" },
  { id: "ie", name: "Ireland", flag: "🇮🇪", weight: 2, euband: "IRL", bg: "#ffffff", fg: "#16181d", fmt: "99-X-9999" },
  { id: "tr", name: "Türkiye", flag: "🇹🇷", weight: 3, euband: "TR", bg: "#ffffff", fg: "#16181d", fmt: "99 XX 999" },
  { id: "in", name: "India", flag: "🇮🇳", weight: 5, euband: "IND", bg: "#ffffff", fg: "#16181d", fmt: "XX 99 XX 9999" },
  { id: "br", name: "Brazil", flag: "🇧🇷", weight: 5, top: "BRASIL", bg: "#ffffff", fg: "#16181d", fmt: "XXX9X99" },
  { id: "mx", name: "Mexico", flag: "🇲🇽", weight: 3, top: "MÉXICO", bg: "#ffffff", fg: "#166534", fmt: "XXX-99-99" },
  { id: "cn", name: "China", flag: "🇨🇳", weight: 4, bg: "#1557c4", fg: "#ffffff", fmt: "X 99999" },
  { id: "za", name: "South Africa", flag: "🇿🇦", weight: 1.5, top: "SOUTH AFRICA", bg: "#ffffff", fg: "#16181d", fmt: "XXX 999 GP" },
  { id: "ae", name: "Dubai (UAE)", flag: "🇦🇪", weight: 1, top: "DUBAI", bg: "#ffffff", fg: "#16181d", fmt: "X 99999" },
  { id: "nz", name: "New Zealand", flag: "🇳🇿", weight: 1, top: "NEW ZEALAND", bg: "#ffffff", fg: "#16181d", fmt: "XXX999" },
  { id: "is", name: "Iceland", flag: "🇮🇸", weight: 0.5, euband: "IS", bg: "#ffffff", fg: "#16181d", fmt: "XX-X99" },
  { id: "mc", name: "Monaco", flag: "🇲🇨", weight: 0.25, top: "MONACO", bg: "#ffffff", fg: "#1e40af", fmt: "9999" },
  { id: "sm", name: "San Marino", flag: "🇸🇲", weight: 0.15, top: "SAN MARINO", bg: "#ffffff", fg: "#0369a1", fmt: "X9999" },
  { id: "li", name: "Liechtenstein", flag: "🇱🇮", weight: 0.15, bg: "#16181d", fg: "#ffffff", fmt: "FL 99999" },
  { id: "va", name: "Vatican City", flag: "🇻🇦", weight: 0.08, top: "VATICANO", bg: "#ffffff", fg: "#16181d", fmt: "SCV 999" },
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
const GREEK = new Set(["CHI", "PHI", "PSI", "ETA", "TAU", "RHO", "NU", "MU", "XI", "PI"]);
const ANIMAL_SOUNDS = new Set(["MOO", "BAA", "MEW", "CAW"]);
const ELEMENTS = new Set([
  "H","B","C","N","O","F","P","S","K","V","Y","I","W","U",
  "HE","LI","BE","NE","NA","MG","AL","SI","CL","AR","CA","SC","TI","CR","MN","FE","CO","NI",
  "CU","ZN","GA","GE","AS","SE","BR","KR","RB","SR","ZR","NB","MO","TC","RU","RH","PD","AG",
  "CD","IN","SN","SB","TE","XE","CS","BA","LA","CE","PR","ND","PM","SM","EU","GD","TB","DY",
  "HO","ER","TM","YB","LU","HF","TA","RE","OS","IR","PT","AU","HG","TL","PB","BI","PO","AT",
  "RN","FR","RA","AC","TH","PA","NP","PU","AM","CM","BK","CF","ES","FM","MD","NO","LR","RF",
  "DB","SG","BH","HS","MT","DS","RG","FL","LV","TS","OG",
]);

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
  // --- digits: deep cuts ---
  { id: "pi314", name: "Slice of Pi", emoji: "🥧", desc: "The digits contain 314.", check: (p) => p.digits.includes("314") },
  { id: "euler", name: "Euler Was Here", emoji: "📐", desc: "The digits contain 271.", check: (p) => p.digits.includes("271") },
  { id: "golden", name: "Golden Ratio", emoji: "🌻", desc: "The digits contain 618.", check: (p) => p.digits.includes("618") },
  { id: "notfound", name: "404 Not Found", emoji: "🚧", desc: "The digits contain 404.", check: (p) => p.digits.includes("404") },
  { id: "dial911", name: "Nine-One-One", emoji: "🚒", desc: "The digits contain 911.", check: (p) => p.digits.includes("911") },
  { id: "easy123", name: "Easy As 123", emoji: "🎹", desc: "The digits contain 123.", check: (p) => p.digits.includes("123") },
  { id: "sum13", name: "Lucky for Some", emoji: "🪬", desc: "The digits add up to 13.", check: (p) => digitSum(p.digits) === 13 },
  { id: "blackjack", name: "Blackjack", emoji: "🃏", desc: "The digits add up to 21. Hit me.", check: (p) => digitSum(p.digits) === 21 },
  { id: "allzero", name: "Absolute Zero", emoji: "🥶", desc: "Every digit is a 0.", check: (p) => p.digits.length >= 2 && /^0+$/.test(p.digits) },
  { id: "boeing", name: "Frequent Flyer", emoji: "✈️", desc: "The digits are exactly 737 or 747.", check: (p) => p.digits === "737" || p.digits === "747" },
  { id: "calculator", name: "Calculator Humour", emoji: "🫣", desc: "The digits contain 8008. You know why.", check: (p) => p.digits.includes("8008") },
  { id: "luggage", name: "Luggage Code", emoji: "🧳", desc: "The digits contain 1234 — the combination on my luggage!", check: (p) => p.digits.includes("1234") },
  // --- letters: deep cuts ---
  { id: "qcontinuum", name: "Q Continuum", emoji: "🌌", desc: "There's a Q on the plate.", check: (p) => p.letters.includes("Q") },
  { id: "doublevowel", name: "Oo La La", emoji: "🦉", desc: "Two vowels sit side by side.", check: (p) => /[AEIOU]{2}/.test(p.letters) },
  { id: "consonants", name: "Crunchy Consonants", emoji: "🥨", desc: "Four or more letters without a single vowel.", check: (p) => p.letters.length >= 4 && ![...p.letters].some((c) => VOWELS.has(c)) },
  { id: "lettermirror", name: "Butterfly Letters", emoji: "🦋", desc: "The letters read the same backwards.", check: (p) => p.letters.length >= 3 && p.letters === [...p.letters].reverse().join("") },
  { id: "fraternity", name: "Frat House", emoji: "🏺", desc: "The letters spell a Greek letter.", check: (p) => GREEK.has(p.letters) },
  { id: "chemistry", name: "Periodic Parking", emoji: "⚗️", desc: "The letters are exactly a chemical element symbol.", check: (p) => ELEMENTS.has(p.letters) },
  { id: "pettingzoo", name: "Petting Zoo", emoji: "🐄", desc: "The letters are an animal sound (MOO, BAA…).", check: (p) => ANIMAL_SOUNDS.has(p.letters) },
  // --- whole plate: deep cuts ---
  { id: "maximalist", name: "Maximalist", emoji: "🐘", desc: "Nine or more characters on one plate.", check: (p) => p.alnum.length >= 9 },
  { id: "minimalist", name: "Minimalist", emoji: "🐁", desc: "Four or fewer characters. Less is more.", check: (p) => p.alnum.length <= 4 },
  // --- world tour combos ---
  { id: "route66", name: "Route 66", emoji: "🛣️", desc: "A US plate with 66 in the digits.", check: (p) => p.region === "us" && p.digits.includes("66") },
  { id: "autobahn", name: "Autobahn", emoji: "🏎️", desc: "A German plate doing 200+.", check: (p) => p.region === "de" && parseInt(p.digits, 10) >= 200 },
  { id: "holdem", name: "Texas Hold'em", emoji: "🤠", desc: "A Texas plate holding a pair of adjacent digits.", check: (p) => p.state === "TX" && /(\d)\1/.test(p.digits) },
  { id: "paris", name: "Champs-Élysées", emoji: "🗼", desc: "A French plate with 75 — bonjour Paris.", check: (p) => p.region === "fr" && p.digits.includes("75") },
  { id: "doubledecker", name: "Double Decker", emoji: "🚌", desc: "A UK plate with twin adjacent letters.", check: (p) => p.region === "uk" && /([A-Z])\1/.test(p.letters) },
  { id: "mokum", name: "020 Mokum", emoji: "🚲", desc: "A Dutch plate with 020 — Amsterdam calling.", check: (p) => p.region === "nl" && p.digits.includes("020") },
  { id: "canadaeh", name: "Eh?", emoji: "🍁", desc: "A Canadian plate with EH in the letters.", check: (p) => p.region === "ca" && p.letters.includes("EH") },
  { id: "skippy", name: "Skippy", emoji: "🦘", desc: "An Australian plate whose letters spell ROO.", check: (p) => p.region === "au" && p.letters === "ROO" },
  // --- digits: another helping ---
  { id: "sum7", name: "Magnificent Seven", emoji: "🌵", desc: "The digits add up to exactly 7.", check: (p) => digitSum(p.digits) === 7 },
  { id: "nelson", name: "Nelson", emoji: "🏏", desc: "The digits contain 111 — unlucky for batsmen.", check: (p) => p.digits.includes("111") },
  { id: "devil667", name: "Devil's Neighbour", emoji: "🏚️", desc: "The digits contain 667. So close to trouble.", check: (p) => p.digits.includes("667") },
  { id: "century", name: "Century", emoji: "💯", desc: "The digits are worth exactly 100.", check: (p) => parseInt(p.digits, 10) === 100 },
  { id: "dozen", name: "Daily Dozen", emoji: "🥚", desc: "The digits are worth exactly 12.", check: (p) => parseInt(p.digits, 10) === 12 && p.digits.length >= 2 },
  { id: "doubledouble", name: "Double Double", emoji: "🥁", desc: "Two pairs of doubled digits in a row, like 1122.", check: (p) => /(\d)\1(\d)\2/.test(p.digits) },
  { id: "sandwich", name: "Digit Sandwich", emoji: "🥪", desc: "First and last digit are the same.", check: (p) => p.digits.length >= 3 && p.digits[0] === p.digits[p.digits.length - 1] },
  { id: "topheavy", name: "Top Heavy", emoji: "🏋️", desc: "Every digit is 5 or higher.", check: (p) => /^[5-9]+$/.test(p.digits) },
  { id: "bottomheavy", name: "Bottom Heavy", emoji: "🛶", desc: "Every digit is 4 or lower.", check: (p) => /^[0-4]+$/.test(p.digits) },
  { id: "callme", name: "Call Me Maybe", emoji: "📱", desc: "The digits start with 06 — a Dutch mobile number.", check: (p) => p.digits.startsWith("06") },
  { id: "verynice", name: "Extremely Nice", emoji: "🫦", desc: "The digits contain 6969.", check: (p) => p.digits.includes("6969") },
  { id: "liftoff", name: "Liftoff", emoji: "🚀", desc: "The digits are exactly 321. We have liftoff.", check: (p) => p.digits === "321" },
  { id: "fullhouse", name: "Full House", emoji: "🏠", desc: "Five or more digits using exactly two values, at least two of each.", check: (p) => { if (p.digits.length < 5) return false; const c = {}; for (const d of p.digits) c[d] = (c[d] ?? 0) + 1; const v = Object.values(c); return v.length === 2 && Math.min(...v) >= 2; } },
  // --- letters: another helping ---
  { id: "pronounce", name: "Pronounceable", emoji: "🗨️", desc: "Vowels and consonants alternate — you could actually say this plate.", check: (p) => p.letters.length >= 3 && [...p.letters].every((c, i) => i === 0 || VOWELS.has(c) !== VOWELS.has(p.letters[i - 1])) },
  { id: "echo", name: "Echo Echo", emoji: "🔊", desc: "The second half of the letters repeats the first.", check: (p) => p.letters.length >= 4 && p.letters.length % 2 === 0 && p.letters.slice(0, p.letters.length / 2) === p.letters.slice(p.letters.length / 2) },
  { id: "toprow", name: "Top Row", emoji: "⌨️", desc: "Every letter from the keyboard's top row (QWERTYUIOP).", check: (p) => p.letters.length >= 2 && /^[QWERTYUIOP]+$/.test(p.letters) },
  { id: "homerow", name: "Home Row", emoji: "🏡", desc: "Every letter from the keyboard's home row (ASDFGHJKL).", check: (p) => p.letters.length >= 2 && /^[ASDFGHJKL]+$/.test(p.letters) },
  { id: "bottomrow", name: "Bottom Row", emoji: "🧦", desc: "Every letter from the keyboard's bottom row (ZXCVBNM).", check: (p) => p.letters.length >= 2 && /^[ZXCVBNM]+$/.test(p.letters) },
  { id: "rgb", name: "Color Channels", emoji: "🎨", desc: "The letters spell RGB, CMY, HSL or HSV.", check: (p) => ["RGB", "CMY", "HSL", "HSV"].includes(p.letters) },
  { id: "money", name: "Money Talks", emoji: "💱", desc: "The letters are a currency code.", check: (p) => ["USD", "EUR", "GBP", "YEN", "JPY", "CHF", "BTC", "ETH"].includes(p.letters) },
  { id: "airport", name: "Airport Code", emoji: "🛫", desc: "The letters are a major airport code.", check: (p) => ["JFK", "LAX", "AMS", "LHR", "CDG", "FRA", "SFO", "ATL", "DXB", "HND", "SYD", "MUC", "MAD", "FCO", "ORD", "SEA", "DEN", "PHX", "MIA", "BOS"].includes(p.letters) },
  { id: "dj", name: "Wedding DJ", emoji: "🎧", desc: "The letters are DJ. Drop the beat.", check: (p) => p.letters === "DJ" },
  { id: "tictactoe", name: "Tic-Tac-Toe", emoji: "⭕", desc: "The letters are XOX or OXO.", check: (p) => p.letters === "XOX" || p.letters === "OXO" },
  { id: "www", name: "World Wide Web", emoji: "🕸️", desc: "The letters are WWW. Dial-up noises.", check: (p) => p.letters === "WWW" },
  // --- the white whale ---
  { id: "beverly", name: "Beverly Hills", emoji: "🌴", desc: "A California plate reading 90210. It does not get rarer than this.", check: (p) => p.state === "CA" && p.digits === "90210" },
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

// Tiers are colour/label bands; EP itself is continuous (see badgeEP), so
// every badge is worth a different amount within its tier.
export const TIERS = [
  { id: "common", name: "Common", min: 0.10 },
  { id: "uncommon", name: "Uncommon", min: 0.01 },
  { id: "rare", name: "Rare", min: 0.001 },
  { id: "epic", name: "Epic", min: 0.0001 },
  { id: "legendary", name: "Legendary", min: 0.00001 },
  { id: "mythic", name: "Mythic", min: 0 },
];

export function badgeTier(badge) {
  const prob = PROBS[badge.id] ?? 0;
  return TIERS.find((t) => prob >= t.min) ?? TIERS[TIERS.length - 1];
}

// EP grows smoothly with rarity: ~×4 for every ×10 rarer. A 50% badge is
// worth ~150 EP, a 1-in-a-million badge ~400,000. Origin badges (country /
// US state) are awarded every roll by definition, so they only pay out 30%
// of the curve — still scaling with rarity, but patterns carry the score.
export function badgeEP(badge) {
  const prob = Math.max(PROBS[badge.id] ?? 2e-7, 2e-7);
  const mult = badge.cat === "country" || badge.cat === "state" ? 0.3 : 1;
  return Math.max(50, Math.round((mult * 100 * Math.pow(1 / prob, 0.6)) / 5) * 5);
}

export function scorePlate(plate) {
  const badges = BADGES.filter((b) => b.check(plate));
  const ep = badges.reduce((sum, b) => sum + badgeEP(b), 0);
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
  "even": 4.99e-1,
  "odd": 5.01e-1,
  "haszero": 3.17e-1,
  "unique": 5.28e-1,
  "sorted": 1.50e-1,
  "countdown": 1.54e-1,
  "sumprime": 3.12e-1,
  "sumten": 3.98e-2,
  "alleven": 9.78e-2,
  "allodd": 1.02e-1,
  "prime": 1.46e-1,
  "eleven": 8.87e-2,
  "thirteen": 2.83e-2,
  "eights": 2.67e-2,
  "nice": 2.84e-2,
  "answer": 2.85e-2,
  "plus31": 2.85e-2,
  "emergency": 1.94e-3,
  "blazeit": 1.87e-3,
  "beast": 1.75e-3,
  "bond": 1.83e-3,
  "lucky7": 1.83e-3,
  "round": 9.62e-3,
  "binary": 8.86e-3,
  "samedigits": 1.35e-2,
  "straight": 5.96e-3,
  "digitmirror": 3.92e-2,
  "maxed": 2.75e-2,
  "lowrider": 2.44e-2,
  "square": 2.47e-2,
  "cube": 4.78e-3,
  "fib": 8.67e-3,
  "pow2": 5.27e-3,
  "year": 2.14e-3,
  "leet": 2.27e-5,
  "rdwok": 8.76e-3,
  "rdw": 8.59e-3,
  "scrabble": 2.79e-1,
  "lsorted": 1.82e-1,
  "ateam": 1.15e-1,
  "zside": 1.00e-1,
  "twins": 7.68e-2,
  "bookends": 2.69e-2,
  "music": 2.27e-2,
  "hex": 1.50e-2,
  "roman": 2.09e-2,
  "vowels": 9.12e-3,
  "ev": 2.84e-3,
  "triple": 6.18e-4,
  "abc": 9.12e-4,
  "word": 1.27e-2,
  "meme": 3.10e-3,
  "city": 3.05e-4,
  "agency": 1.29e-4,
  "dutch": 2.79e-4,
  "founder": 2.33e-4,
  "modern": 6.46e-3,
  "classic": 1.23e-3,
  "oldtimer": 3.51e-4,
  "spotdiff": 3.11e-2,
  "dejavu": 2.09e-3,
  "palindrome": 1.02e-4,
  "popemobile": 6.93e-7,
  "sevens5": 1.24e-6,
  "pi314": 1.90e-3,
  "euler": 1.92e-3,
  "golden": 1.90e-3,
  "notfound": 1.88e-3,
  "dial911": 1.87e-3,
  "easy123": 1.91e-3,
  "sum13": 4.88e-2,
  "blackjack": 3.80e-2,
  "allzero": 1.14e-3,
  "boeing": 6.92e-4,
  "calculator": 1.03e-4,
  "luggage": 1.11e-4,
  "qcontinuum": 1.01e-1,
  "doublevowel": 6.41e-2,
  "consonants": 1.39e-1,
  "lettermirror": 1.41e-2,
  "fraternity": 1.12e-3,
  "chemistry": 7.48e-2,
  "pettingzoo": 8.00e-5,
  "maximalist": 4.32e-2,
  "minimalist": 2.10e-2,
  "route66": 3.41e-3,
  "autobahn": 3.70e-2,
  "holdem": 6.51e-4,
  "paris": 1.20e-3,
  "doubledecker": 1.01e-2,
  "mokum": 1.40e-5,
  "canadaeh": 1.59e-4,
  "skippy": 1.97e-6,
  "sum7": 2.57e-2,
  "nelson": 1.81e-3,
  "devil667": 1.78e-3,
  "century": 3.78e-4,
  "dozen": 1.31e-3,
  "doubledouble": 9.59e-3,
  "sandwich": 8.84e-2,
  "topheavy": 1.02e-1,
  "bottomheavy": 9.76e-2,
  "callme": 8.93e-3,
  "verynice": 9.87e-5,
  "liftoff": 3.31e-4,
  "fullhouse": 1.64e-3,
  "pronounce": 7.21e-2,
  "echo": 3.78e-4,
  "toprow": 4.98e-2,
  "homerow": 4.60e-2,
  "bottomrow": 1.90e-2,
  "rgb": 7.73e-5,
  "money": 1.48e-4,
  "airport": 5.49e-4,
  "dj": 2.23e-4,
  "tictactoe": 3.60e-5,
  "www": 1.67e-5,
  "beverly": 2.43e-8,
  "cc-nl": 1.74e-2,
  "cc-de": 7.81e-2,
  "cc-us": 1.21e-1,
  "cc-be": 2.58e-2,
  "cc-fr": 6.09e-2,
  "cc-uk": 6.97e-2,
  "cc-it": 5.20e-2,
  "cc-es": 4.35e-2,
  "cc-pl": 2.57e-2,
  "cc-se": 1.73e-2,
  "cc-ch": 1.72e-2,
  "cc-at": 1.73e-2,
  "cc-jp": 4.33e-2,
  "cc-au": 3.44e-2,
  "cc-ca": 3.47e-2,
  "cc-no": 1.75e-2,
  "cc-dk": 1.73e-2,
  "cc-lu": 6.89e-3,
  "cc-fi": 1.73e-2,
  "cc-gr": 1.73e-2,
  "cc-pt": 1.74e-2,
  "cc-cz": 1.72e-2,
  "cc-ie": 1.73e-2,
  "cc-tr": 2.60e-2,
  "cc-in": 4.32e-2,
  "cc-br": 4.29e-2,
  "cc-mx": 2.62e-2,
  "cc-cn": 3.51e-2,
  "cc-za": 1.29e-2,
  "cc-ae": 8.63e-3,
  "cc-nz": 8.60e-3,
  "cc-is": 4.34e-3,
  "cc-mc": 2.13e-3,
  "cc-sm": 1.29e-3,
  "cc-li": 1.34e-3,
  "cc-va": 6.84e-4,
  "us-AL": 2.42e-3,
  "us-AK": 2.45e-3,
  "us-AZ": 2.39e-3,
  "us-AR": 2.48e-3,
  "us-CA": 2.41e-3,
  "us-CO": 2.39e-3,
  "us-CT": 2.39e-3,
  "us-DE": 2.42e-3,
  "us-FL": 2.46e-3,
  "us-GA": 2.42e-3,
  "us-HI": 2.43e-3,
  "us-ID": 2.42e-3,
  "us-IL": 2.42e-3,
  "us-IN": 2.43e-3,
  "us-IA": 2.43e-3,
  "us-KS": 2.53e-3,
  "us-KY": 2.40e-3,
  "us-LA": 2.40e-3,
  "us-ME": 2.44e-3,
  "us-MD": 2.35e-3,
  "us-MA": 2.40e-3,
  "us-MI": 2.44e-3,
  "us-MN": 2.45e-3,
  "us-MS": 2.47e-3,
  "us-MO": 2.37e-3,
  "us-MT": 2.39e-3,
  "us-NE": 2.48e-3,
  "us-NV": 2.45e-3,
  "us-NH": 2.37e-3,
  "us-NJ": 2.47e-3,
  "us-NM": 2.44e-3,
  "us-NY": 2.40e-3,
  "us-NC": 2.38e-3,
  "us-ND": 2.39e-3,
  "us-OH": 2.43e-3,
  "us-OK": 2.37e-3,
  "us-OR": 2.49e-3,
  "us-PA": 2.44e-3,
  "us-RI": 2.41e-3,
  "us-SC": 2.48e-3,
  "us-SD": 2.44e-3,
  "us-TN": 2.43e-3,
  "us-TX": 2.43e-3,
  "us-UT": 2.38e-3,
  "us-VT": 2.45e-3,
  "us-VA": 2.42e-3,
  "us-WA": 2.45e-3,
  "us-WV": 2.42e-3,
  "us-WI": 2.39e-3,
  "us-WY": 2.45e-3,
};
