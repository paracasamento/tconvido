export function parseGiftNames(value: string) {
  return value
    .split(/[;\n]+/g)
    .map(name => name.replace(/\s+/g, " ").trim())
    .filter(name => name.length >= 2);
}
