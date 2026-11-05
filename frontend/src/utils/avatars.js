export const AVATAR_LIST = [
  { id: 'banana_hero', name: 'Banana Hero', emoji: '🍌', bg: 'from-amber-400 to-yellow-500' },
  { id: 'monkey_king', name: 'Monkey King', emoji: '👑🐒', bg: 'from-yellow-500 to-amber-600' },
  { id: 'detective_ape', name: 'Detective Ape', emoji: '🕵️‍♂️🐵', bg: 'from-blue-500 to-indigo-600' },
  { id: 'golden_banana', name: 'Golden Banana', emoji: '✨🍌', bg: 'from-amber-300 to-yellow-600' },
  { id: 'ninja_monkey', name: 'Ninja Monkey', emoji: '🥷🐒', bg: 'from-purple-600 to-slate-800' },
  { id: 'cyber_ape', name: 'Cyber Ape', emoji: '🤖🦍', bg: 'from-cyan-500 to-blue-600' },
  { id: 'banana_wizard', name: 'Banana Wizard', emoji: '🧙‍♂️🍌', bg: 'from-violet-500 to-fuchsia-600' },
  { id: 'captain_chimp', name: 'Captain Chimp', emoji: '👨‍✈️🐵', bg: 'from-emerald-500 to-teal-700' },
];

export const getAvatarMeta = (avatarId) => {
  return AVATAR_LIST.find((a) => a.id === avatarId) || AVATAR_LIST[0];
};
