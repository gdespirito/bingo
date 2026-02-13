import { describe, it, expect, beforeEach } from 'vitest'
import { cards, addCard, removeCard, updateCard, generateRandomGrid } from '../useBingoCards'

describe('useBingoCards', () => {
  beforeEach(() => {
    while (cards.value.length > 0) {
      removeCard(cards.value[0]!.id)
    }
  })

  const grid: (number | null)[][] = [
    [1, 16, 31, 46, 61],
    [2, 17, 32, 47, 62],
    [3, 18, null, 48, 63],
    [4, 19, 34, 49, 64],
    [5, 20, 35, 50, 65],
  ]

  describe('card CRUD', () => {
    it('adds a card', () => {
      addCard('Test Card', grid)
      expect(cards.value).toHaveLength(1)
      expect(cards.value[0]!.name).toBe('Test Card')
      expect(cards.value[0]!.grid).toEqual(grid)
    })

    it('persists cards to localStorage', () => {
      addCard('Persisted', grid)
      const stored = JSON.parse(localStorage.getItem('bingo-cards')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Persisted')
    })

    it('removes a card by id', () => {
      addCard('ToRemove', grid)
      const id = cards.value[0]!.id
      removeCard(id)
      expect(cards.value).toHaveLength(0)
    })

    it('updates a card', () => {
      addCard('Old Name', grid)
      const id = cards.value[0]!.id
      const newGrid = grid.map((row) => [...row])
      newGrid[0]![0] = 15
      updateCard(id, 'New Name', newGrid)

      expect(cards.value[0]!.name).toBe('New Name')
      expect(cards.value[0]!.grid[0]![0]).toBe(15)
    })
  })

  describe('generateRandomGrid', () => {
    it('returns a 5x5 grid', () => {
      const g = generateRandomGrid()
      expect(g).toHaveLength(5)
      for (const row of g) {
        expect(row).toHaveLength(5)
      }
    })

    it('has FREE center (null at [2][2])', () => {
      const g = generateRandomGrid()
      expect(g[2]![2]).toBeNull()
    })

    it('has correct column ranges', () => {
      const g = generateRandomGrid()
      const ranges = [
        [1, 15],
        [16, 30],
        [31, 45],
        [46, 60],
        [61, 75],
      ]
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 5; row++) {
          const cell = g[row]![col]
          if (cell === null) continue
          expect(cell).toBeGreaterThanOrEqual(ranges[col]![0]!)
          expect(cell).toBeLessThanOrEqual(ranges[col]![1]!)
        }
      }
    })

    it('has no duplicate numbers within a column', () => {
      const g = generateRandomGrid()
      for (let col = 0; col < 5; col++) {
        const nums = []
        for (let row = 0; row < 5; row++) {
          const cell = g[row]![col]
          if (cell !== null) nums.push(cell)
        }
        expect(new Set(nums).size).toBe(nums.length)
      }
    })
  })
})
