export const columns = [
  { letter: 'B', start: 1, end: 15, color: '#e74c3c' },
  { letter: 'I', start: 16, end: 30, color: '#f39c12' },
  { letter: 'N', start: 31, end: 45, color: '#2ecc71' },
  { letter: 'G', start: 46, end: 60, color: '#3498db' },
  { letter: 'O', start: 61, end: 75, color: '#9b59b6' },
]

export function getLetterForNumber(num: number): string {
  if (num <= 15) return 'B'
  if (num <= 30) return 'I'
  if (num <= 45) return 'N'
  if (num <= 60) return 'G'
  return 'O'
}

export function getColorForNumber(num: number): string {
  const col = columns.find((c) => num >= c.start && num <= c.end)
  return col?.color ?? '#888'
}

export function getColorForColumn(colIdx: number): string {
  return columns[colIdx]?.color ?? '#888'
}
