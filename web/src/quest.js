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
