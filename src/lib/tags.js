export const MAX_TAGS_PER_POST = 8;
export const MAX_TAG_LENGTH = 24;

export function cleanTagName(value) {
  if (typeof value !== 'string') return '';

  const normalized = value
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .toLocaleLowerCase('ko-KR')
    .slice(0, MAX_TAG_LENGTH);

  return /[\p{L}\p{N}]/u.test(normalized) ? normalized : '';
}

export function normalizeTags(tags) {
  const values = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];
  const seen = new Set();
  const normalized = [];

  for (const value of values) {
    const tag = cleanTagName(value);
    if (!tag || seen.has(tag)) continue;
    seen.add(tag);
    normalized.push(tag);
    if (normalized.length >= MAX_TAGS_PER_POST) break;
  }

  return normalized;
}

export function formatTagLabel(tag) {
  const normalized = cleanTagName(tag);
  return normalized ? `#${normalized}` : '';
}

export function getTagRoute(tag) {
  const normalized = cleanTagName(tag);
  return normalized ? `/feed?tag=${encodeURIComponent(normalized)}` : '/feed';
}
