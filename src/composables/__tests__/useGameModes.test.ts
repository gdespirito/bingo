import { describe, it, expect, beforeEach } from 'vitest'
import { gameModes, activeGameMode, setGameMode, getActivePattern, isCellInPattern, checkCardWin, getWinningCards } from '../useGameModes'
import { toggleNumber, resetBoard } from '../useCalledNumbers'
import { cards, addCard, removeCard } from '../useBingoCards'

describe('useGameModes', () => {
  beforeEach(() => {
    resetBoard()
    while (cards.value.length > 0) {
      removeCard(cards.value[0]!.id)
    }
    setGameMode('completo')
  })

  describe('gameModes', () => {
    it('has 5 game modes', () => {
      expect(gameModes).toHaveLength(5)
    })

    it('completo covers all 25 cells', () => {
      expect(gameModes.find((m) => m.id === 'completo')!.cells).toHaveLength(25)
    })

    it('L has 9 cells', () => {
      expect(gameModes.find((m) => m.id === 'L')!.cells).toHaveLength(9)
    })

    it('U has 13 cells', () => {
      expect(gameModes.find((m) => m.id === 'U')!.cells).toHaveLength(13)
    })

    it('O has 16 cells (border)', () => {
      expect(gameModes.find((m) => m.id === 'O')!.cells).toHaveLength(16)
    })

    it('X has 9 cells (diagonals)', () => {
      expect(gameModes.find((m) => m.id === 'X')!.cells).toHaveLength(9)
    })
  })

  describe('activeGameMode', () => {
    it('defaults to completo', () => {
      expect(activeGameMode.value).toBe('completo')
    })

    it('changes game mode', () => {
      setGameMode('L')
      expect(activeGameMode.value).toBe('L')
      expect(localStorage.getItem('bingo-gamemode')).toBe('L')
    })
  })

  describe('getActivePattern', () => {
    it('returns the correct pattern', () => {
      setGameMode('X')
      const pattern = getActivePattern()
      expect(pattern.id).toBe('X')
      expect(pattern.cells).toHaveLength(9)
    })
  })

  describe('isCellInPattern', () => {
    it('checks correctly for L pattern', () => {
      setGameMode('L')
      // Left column cells are in pattern
      expect(isCellInPattern(0, 0)).toBe(true)
      expect(isCellInPattern(4, 0)).toBe(true)
      // Bottom row cells are in pattern
      expect(isCellInPattern(4, 4)).toBe(true)
      // Top-right is not in L pattern
      expect(isCellInPattern(0, 4)).toBe(false)
    })
  })

  describe('checkCardWin', () => {
    const makeGrid = (): (number | null)[][] => [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, null, 48, 63],
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ]

    it('does not win when no numbers are called', () => {
      const card = { id: '1', name: 'Test', grid: makeGrid() }
      expect(checkCardWin(card)).toBe(false)
    })

    it('wins in L mode when left column + bottom row are called', () => {
      setGameMode('L')
      for (const n of [1, 2, 3, 4, 5, 20, 35, 50, 65]) toggleNumber(n)

      const card = { id: '1', name: 'Test', grid: makeGrid() }
      expect(checkCardWin(card)).toBe(true)
    })

    it('does not win in L mode when missing one number', () => {
      setGameMode('L')
      for (const n of [1, 2, 3, 4, 5, 20, 35, 50]) toggleNumber(n) // missing 65

      const card = { id: '1', name: 'Test', grid: makeGrid() }
      expect(checkCardWin(card)).toBe(false)
    })

    it('wins in X mode when both diagonals are called', () => {
      setGameMode('X')
      for (const n of [1, 17, 49, 65, 61, 47, 19, 5]) toggleNumber(n)

      const card = { id: '1', name: 'Test', grid: makeGrid() }
      expect(checkCardWin(card)).toBe(true)
    })

    it('wins in completo mode when all card numbers are called', () => {
      setGameMode('completo')
      const grid = makeGrid()
      for (const row of grid) {
        for (const cell of row) {
          if (cell !== null) toggleNumber(cell)
        }
      }
      expect(checkCardWin({ id: '1', name: 'Test', grid })).toBe(true)
    })
  })

  describe('getWinningCards', () => {
    it('returns only winning cards', () => {
      setGameMode('L')
      const winGrid: (number | null)[][] = [
        [1, 16, 31, 46, 61],
        [2, 17, 32, 47, 62],
        [3, 18, null, 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65],
      ]
      const loseGrid: (number | null)[][] = [
        [10, 25, 40, 55, 70],
        [11, 26, 41, 56, 71],
        [12, 27, null, 57, 72],
        [13, 28, 43, 58, 73],
        [14, 29, 44, 59, 74],
      ]

      addCard('Winner', winGrid)
      addCard('Loser', loseGrid)

      for (const n of [1, 2, 3, 4, 5, 20, 35, 50, 65]) toggleNumber(n)

      const winners = getWinningCards()
      expect(winners).toHaveLength(1)
      expect(winners[0]!.name).toBe('Winner')
    })
  })
})
