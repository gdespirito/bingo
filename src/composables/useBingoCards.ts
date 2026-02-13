import { ref } from 'vue'
import type { BingoCard } from './useBingoState.types'

const CARDS_KEY = 'bingo-cards'

function loadCards(): BingoCard[] {
  try {
    const raw = localStorage.getItem(CARDS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return []
}

export const cards = ref<BingoCard[]>(loadCards())

function saveCards() {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards.value))
}

export function addCard(name: string, grid: (number | null)[][]) {
  cards.value.push({ id: Date.now().toString(), name, grid })
  saveCards()
}

export function removeCard(id: string) {
  cards.value = cards.value.filter((c) => c.id !== id)
  saveCards()
}

export function updateCard(id: string, name: string, grid: (number | null)[][]) {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.name = name
    card.grid = grid
    saveCards()
  }
}

export function generateRandomGrid(): (number | null)[][] {
  const ranges = [
    { start: 1, end: 15 },
    { start: 16, end: 30 },
    { start: 31, end: 45 },
    { start: 46, end: 60 },
    { start: 61, end: 75 },
  ]

  const colNumbers = ranges.map(({ start, end }) => {
    const pool: number[] = []
    for (let n = start; n <= end; n++) pool.push(n)
    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!]
    }
    return pool.slice(0, 5)
  })

  const grid: (number | null)[][] = []
  for (let row = 0; row < 5; row++) {
    const r: (number | null)[] = []
    for (let col = 0; col < 5; col++) {
      r.push(colNumbers[col]![row]!)
    }
    grid.push(r)
  }
  // FREE center
  grid[2]![2] = null
  return grid
}
