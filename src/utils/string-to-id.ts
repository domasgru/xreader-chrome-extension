export function stringToId(str: string): string {
  let hash: number = 0;
  for (let i: number = 0; i < str.length; i++) {
    const char: number = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
