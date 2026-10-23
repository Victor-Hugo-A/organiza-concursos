export function parsePdfByteRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size < 1)
    return null;

  const suffix = match[1] ? null : Number(match[2]);
  const start = match[1] ? Number(match[1]) : Math.max(0, size - (suffix ?? 0));
  const end =
    match[2] && match[1] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start ||
    (suffix !== null && suffix <= 0)
  )
    return null;

  return { start, end };
}
