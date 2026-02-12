export interface BingoCard {
  id: string
  name: string
  grid: (number | null)[][] // 5 rows x 5 cols, center is null (FREE)
}

export type GameMode = 'completo' | 'L' | 'U' | 'O' | 'X'

export interface GameModeInfo {
  id: GameMode
  label: string
  icon: string
  // cells that must be marked to win: [row, col][]
  cells: [number, number][]
}
