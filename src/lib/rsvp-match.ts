import { normalizeName } from "@/lib/security";

function tokens(value: string) {
  return normalizeName(value).split(" ").filter(Boolean);
}

export function guestNameMatchScore(submittedName: string, officialName: string) {
  const submitted = normalizeName(submittedName);
  const official = normalizeName(officialName);

  if (!submitted || !official) return 0;
  if (submitted === official) return 100;

  const a = tokens(submitted);
  const b = tokens(official);
  if (!a.length || !b.length) return 0;

  const setA = new Set(a);
  const setB = new Set(b);
  const overlap = [...setA].filter(token => setB.has(token)).length;
  const union = new Set([...a, ...b]).size;
  const tokenScore = union ? (overlap / union) * 100 : 0;

  let score = Math.round(tokenScore * 0.7);

  if (a[0] === b[0]) score += 25;
  if (official.startsWith(`${submitted} `) || submitted.startsWith(`${official} `)) score += 15;
  if (a[a.length - 1] === b[b.length - 1] && a.length > 1 && b.length > 1) score += 10;

  return Math.max(0, Math.min(99, score));
}

export function guestMatchStatus(submittedName: string, officialName: string) {
  const score = guestNameMatchScore(submittedName, officialName);
  return {
    score,
    status: score === 100 ? ("exact" as const) : ("probable" as const),
    needsReview: score !== 100,
  };
}
