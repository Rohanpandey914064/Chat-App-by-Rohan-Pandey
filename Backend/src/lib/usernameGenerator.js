// Wordlists are carefully chosen to be neutral, non-offensive, and non-identifiable
const ADJECTIVES = [
  "Silent", "Hidden", "Calm", "Bright", "Brave", "Blue", "Dark", "Swift",
  "Quiet", "Wild", "Gentle", "Bold", "Free", "Sharp", "Lone", "Vast",
  "Still", "Deep", "High", "Soft", "Cool", "Warm", "Clear", "Amber",
  "Crimson", "Golden", "Silver", "Ivory", "Jade", "Cobalt", "Misty",
  "Frosty", "Sunny", "Stormy", "Windy", "Breezy", "Shady", "Gloomy",
  "Dapper", "Sleek", "Ancient", "Nimble", "Fearless", "Hollow", "Cosmic",
  "Lunar", "Solar", "Astral", "Neon", "Velvet", "Crystal",
];

const NOUNS = [
  "Fox", "Moon", "Wolf", "Cloud", "Tiger", "River", "Storm", "Eagle",
  "Bear", "Hawk", "Deer", "Raven", "Falcon", "Lynx", "Otter", "Heron",
  "Crane", "Sparrow", "Finch", "Robin", "Panda", "Comet", "Nebula",
  "Star", "Ocean", "Forest", "Canyon", "Prairie", "Meadow", "Glacier",
  "Dune", "Reef", "Grove", "Peak", "Ridge", "Vale", "Brook", "Crest",
  "Ember", "Flare", "Gale", "Mist", "Frost", "Breeze", "Thunder",
  "Shadow", "Flame", "Dawn", "Dusk", "Horizon",
];

/**
 * Generate a random anonymous username in the format: AdjectiveNoun###
 * Example: SilentFox482, HiddenMoon731, CalmWolf294
 */
export function generateAnonymousUsername() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 900) + 100; // 100–999
  return `${adj}${noun}${num}`;
}
