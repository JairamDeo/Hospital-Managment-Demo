const AVATAR_CLASSES = [
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-teal-100 text-teal-800',
];

export const pickAvatarClass = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length];
};

export const getInitialsFromName = (name) => {
  const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};
