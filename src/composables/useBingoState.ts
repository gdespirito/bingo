import { ref, computed } from 'vue'

const STORAGE_KEY = 'bingo-state'
const CARDS_KEY = 'bingo-cards'
const GAMEMODE_KEY = 'bingo-gamemode'

export interface BingoCard {
  id: string
  name: string
  grid: (number | null)[][] // 5 rows x 5 cols, center is null (FREE)
}

// ── Game modes / patterns ──

export type GameMode = 'completo' | 'L' | 'U' | 'O' | 'X'

export interface GameModeInfo {
  id: GameMode
  label: string
  icon: string
  // cells that must be marked to win: [row, col][]
  cells: [number, number][]
}

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
const activeGameMode = ref<GameMode>(savedMode && gameModes.some((m) => m.id === savedMode) ? savedMode : 'completo')

function setGameMode(mode: GameMode) {
  activeGameMode.value = mode
  localStorage.setItem(GAMEMODE_KEY, mode)
}

function getActivePattern(): GameModeInfo {
  return gameModes.find((m) => m.id === activeGameMode.value) ?? gameModes[0]!
}

// Build a Set of "row,col" strings for quick lookup
function patternCellSet(): Set<string> {
  const pattern = getActivePattern()
  return new Set(pattern.cells.map(([r, c]) => `${r},${c}`))
}

function isCellInPattern(row: number, col: number): boolean {
  return patternCellSet().has(`${row},${col}`)
}

function checkCardWin(card: BingoCard): boolean {
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

function getWinningCards(): BingoCard[] {
  return cards.value.filter((card) => checkCardWin(card))
}

// ── Called numbers (shared singleton) ──

function loadCalledState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        history: data.history as number[],
        calledNumbers: new Set<number>(data.history),
        lastCalled:
          data.history.length > 0 ? data.history[data.history.length - 1] : null,
      }
    }
  } catch {
    /* ignore */
  }
  return { history: [] as number[], calledNumbers: new Set<number>(), lastCalled: null as number | null }
}

const saved = loadCalledState()
const calledNumbers = ref<Set<number>>(saved.calledNumbers)
const lastCalled = ref<number | null>(saved.lastCalled)
const history = ref<number[]>(saved.history)

function saveCalledState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: history.value }))
}

function toggleNumber(num: number) {
  if (calledNumbers.value.has(num)) {
    calledNumbers.value.delete(num)
    history.value = history.value.filter((n) => n !== num)
    if (lastCalled.value === num) {
      lastCalled.value =
        history.value.length > 0 ? history.value[history.value.length - 1]! : null
    }
  } else {
    calledNumbers.value.add(num)
    history.value.push(num)
    lastCalled.value = num
  }
  calledNumbers.value = new Set(calledNumbers.value)
  saveCalledState()
}

function resetBoard() {
  calledNumbers.value = new Set()
  lastCalled.value = null
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
}

const totalCalled = computed(() => calledNumbers.value.size)

// ── Cards ──

function loadCards(): BingoCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

const cards = ref<BingoCard[]>(loadCards())

function saveCards() {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards.value))
}

function addCard(name: string, grid: (number | null)[][]) {
  cards.value.push({ id: Date.now().toString(), name, grid })
  saveCards()
}

function removeCard(id: string) {
  cards.value = cards.value.filter((c) => c.id !== id)
  saveCards()
}

function updateCard(id: string, name: string, grid: (number | null)[][]) {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.name = name
    card.grid = grid
    saveCards()
  }
}

// ── Helpers ──

const columns = [
  { letter: 'B', start: 1, end: 15, color: '#e74c3c' },
  { letter: 'I', start: 16, end: 30, color: '#f39c12' },
  { letter: 'N', start: 31, end: 45, color: '#2ecc71' },
  { letter: 'G', start: 46, end: 60, color: '#3498db' },
  { letter: 'O', start: 61, end: 75, color: '#9b59b6' },
]

function getLetterForNumber(num: number): string {
  if (num <= 15) return 'B'
  if (num <= 30) return 'I'
  if (num <= 45) return 'N'
  if (num <= 60) return 'G'
  return 'O'
}

function getColorForNumber(num: number): string {
  const col = columns.find((c) => num >= c.start && num <= c.end)
  return col?.color ?? '#888'
}

function getColorForColumn(colIdx: number): string {
  return columns[colIdx]?.color ?? '#888'
}

export function useBingoState() {
  return {
    // called numbers
    calledNumbers,
    lastCalled,
    history,
    totalCalled,
    toggleNumber,
    resetBoard,
    // cards
    cards,
    addCard,
    removeCard,
    updateCard,
    // game modes
    activeGameMode,
    gameModes,
    setGameMode,
    getActivePattern,
    isCellInPattern,
    checkCardWin,
    getWinningCards,
    // helpers
    columns,
    getLetterForNumber,
    getColorForNumber,
    getColorForColumn,
  }
}
