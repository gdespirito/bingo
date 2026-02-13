import { ref } from 'vue'
import type { BingoCard, GameMode, GameModeInfo } from './useBingoState.types'
import { calledNumbers } from './useCalledNumbers'
import { cards } from './useBingoCards'

const GAMEMODE_KEY = 'bingo-gamemode'

const allCells: [number, number][] = []
for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) allCells.push([r, c])

export const gameModes: GameModeInfo[] = [
  {
    id: 'completo',
    label: 'Completo',
    icon: '🟩',
    cells: allCells,
  },
  {
    id: 'L',
    label: 'L',
    icon: '🇱',
    // Left column + bottom row
    cells: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
      [4, 1], [4, 2], [4, 3], [4, 4],
    ],
  },
  {
    id: 'U',
    label: 'U',
    icon: '🇺',
    // Left column + bottom row + right column
    cells: [
      [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
      [4, 1], [4, 2], [4, 3],
      [4, 4], [3, 4], [2, 4], [1, 4], [0, 4],
    ],
  },
  {
    id: 'O',
    label: 'O',
    icon: '🅾️',
    // Full border
    cells: [
      [0, 0], [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 0], [1, 4],
      [2, 0], [2, 4],
      [3, 0], [3, 4],
      [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],
    ],
  },
  {
    id: 'X',
    label: 'X',
    icon: '❌',
    // Both diagonals
    cells: [
      [0, 0], [1, 1], [2, 2], [3, 3], [4, 4],
      [0, 4], [1, 3], [3, 1], [4, 0],
    ],
  },
]

const savedMode = localStorage.getItem(GAMEMODE_KEY) as GameMode | null
export const activeGameMode = ref<GameMode>(
  savedMode && gameModes.some((m) => m.id === savedMode) ? savedMode : 'completo',
)

export function setGameMode(mode: GameMode) {
  activeGameMode.value = mode
  localStorage.setItem(GAMEMODE_KEY, mode)
}

export function getActivePattern(): GameModeInfo {
  return gameModes.find((m) => m.id === activeGameMode.value) ?? gameModes[0]!
}

function patternCellSet(): Set<string> {
  const pattern = getActivePattern()
  return new Set(pattern.cells.map(([r, c]) => `${r},${c}`))
}

export function isCellInPattern(row: number, col: number): boolean {
  return patternCellSet().has(`${row},${col}`)
}

export function checkCardWin(card: BingoCard): boolean {
  const pattern = getActivePattern()
  for (const [r, c] of pattern.cells) {
    const cell = card.grid[r]![c]
    // null = FREE, always counts as called
    if (cell !== null && cell !== undefined && !calledNumbers.value.has(cell)) {
      return false
    }
  }
  return true
}

export function getWinningCards(): BingoCard[] {
  return cards.value.filter((card) => checkCardWin(card))
}
