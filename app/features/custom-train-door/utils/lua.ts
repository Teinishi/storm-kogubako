export function withIndent(lines: string[], count = 0, indent = '  ') {
  const p = indent.repeat(count);
  return lines.map((v, i) => (i === 0 ? v : p + v)).join('\n');
}
