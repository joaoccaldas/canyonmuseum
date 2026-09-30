// The first minute. HTML only. The museum is not part of this.
// Rewards are events. This file does not add credits.

export const INTENTS = [
  { id: 'racing', label: 'Racing Kona' },
  { id: 'dreaming', label: 'Dreaming of Kona' },
  { id: 'supporting', label: 'Supporting someone' },
  { id: 'exploring', label: 'Just exploring' },
];

export const BIKES = [
  { id: 'canyon-cfr-2027', label: 'Speedmax CFR AXS' },
  { id: 'canyon-slx-2027', label: 'Speedmax CF SLX 8 Di2' },
  { id: 'canyon-speedmax-cf-2011', label: 'Speedmax CF 9.0 Pro' },
];

export const SHOES = [
  { id: 'nike-alphafly-3-study', label: 'Nike Alphafly 3' },
];

export const GOALS = ['Finish', 'Personal best', 'Sub-12', 'Sub-10', 'Podium', 'Someday'];

export function emptyQuest() {
  return { intent: null, bikeId: null, shoeId: null, goal: null };
}

export function relationshipFor(intent) {
  if (intent === 'racing') return 'owned';
  if (intent === 'dreaming') return 'dream';
  return 'try';
}

export function questReady(draft) {
  return !!(draft?.intent && draft?.goal);
}

const GOAL_SLUG = {
  Finish: 'finish',
  'Personal best': 'pb',
  'Sub-12': 'sub-12',
  'Sub-10': 'sub-10',
  Podium: 'podium',
  Someday: 'someday',
};
const GOAL_FROM_SLUG = Object.fromEntries(Object.entries(GOAL_SLUG).map(([label, slug]) => [slug, label]));

export function questLabels(draft) {
  return {
    bike: BIKES.find(bike => bike.id === draft?.bikeId)?.label || 'Bike later',
    shoe: SHOES.find(shoe => shoe.id === draft?.shoeId)?.label || 'Shoes later',
    goal: draft?.goal || '',
  };
}

/** A share token names only a known intent, bike, shoe and goal. */
export function encodeShare(draft) {
  if (!questReady(draft)) return null;
  if (!INTENTS.some(item => item.id === draft.intent)) return null;
  const goal = GOAL_SLUG[draft.goal];
  if (!goal) return null;
  if (draft.bikeId && !BIKES.some(bike => bike.id === draft.bikeId)) return null;
  if (draft.shoeId && !SHOES.some(shoe => shoe.id === draft.shoeId)) return null;
  return [draft.intent, draft.bikeId || '', draft.shoeId || '', goal].join('.');
}

export function decodeShare(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 4) return null;
  const [intent, bikeId, shoeId, goalSlug] = parts;
  const goal = GOAL_FROM_SLUG[goalSlug];
  if (!INTENTS.some(item => item.id === intent) || !goal) return null;
  if (bikeId && !BIKES.some(bike => bike.id === bikeId)) return null;
  if (shoeId && !SHOES.some(shoe => shoe.id === shoeId)) return null;
  return { intent, bikeId: bikeId || null, shoeId: shoeId || null, goal };
}
