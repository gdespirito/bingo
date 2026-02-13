import { describe, it, expect, beforeEach } from 'vitest'
import { useBingoState, gameModes } from '../useBingoState'

describe('useBingoState', () => {
  let state: ReturnType<typeof useBingoState>

  beforeEach(() => {
    state = useBingoState()
    state.resetBoard()
    // Clear cards
    while (state.cards.value.length > 0) {
      state.removeCard(state.cards.value[0]!.id)
    }
    state.setGameMode('completo')
  })

  // ── toggleNumber ──

  describe('toggleNumber', () => {
    it('adds a number to called numbers', () => {
      state.toggleNumber(42)
      expect(state.calledNumbers.value.has(42)).toBe(true)
      expect(state.lastCalled.value).toBe(42)
      expect(state.history.value).toContain(42)
    })

    it('removes a number when toggled again', () => {
      state.toggleNumber(42)
      state.toggleNumber(42)
      expect(state.calledNumbers.value.has(42)).toBe(false)
      expect(state.history.value).not.toContain(42)
    })

    it('updates lastCalled to previous number on untoggle', () => {
      state.toggleNumber(10)
      state.toggleNumber(25)
      state.toggleNumber(25)
      expect(state.lastCalled.value).toBe(10)
    })

    it('sets lastCalled to null when all numbers are untoggled', () => {
      state.toggleNumber(10)
      state.toggleNumber(10)
      expect(state.lastCalled.value).toBeNull()
    })

    it('tracks totalCalled correctly', () => {
      expect(state.totalCalled.value).toBe(0)
      state.toggleNumber(1)
      state.toggleNumber(75)
      expect(state.totalCalled.value).toBe(2)
      state.toggleNumber(1)
      expect(state.totalCalled.value).toBe(1)
    })

    it('persists to localStorage', () => {
      state.toggleNumber(33)
      const stored = JSON.parse(localStorage.getItem('bingo-state')!)
      expect(stored.history).toContain(33)
    })
  })

  // ── resetBoard ──

  describe('resetBoard', () => {
    it('clears all called numbers and history', () => {
      state.toggleNumber(1)
      state.toggleNumber(50)
      state.resetBoard()

      expect(state.calledNumbers.value.size).toBe(0)
      expect(state.lastCalled.value).toBeNull()
      expect(state.history.value).toHaveLength(0)
      expect(localStorage.getItem('bingo-state')).toBeNull()
    })
  })

  // ── Card CRUD ──

  describe('card management', () => {
    const grid: (number | null)[][] = [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, null, 48, 63],
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ]

    it('adds a card', () => {
      state.addCard('Test Card', grid)
      expect(state.cards.value).toHaveLength(1)
      expect(state.cards.value[0]!.name).toBe('Test Card')
      expect(state.cards.value[0]!.grid).toEqual(grid)
    })

    it('persists cards to localStorage', () => {
      state.addCard('Persisted', grid)
      const stored = JSON.parse(localStorage.getItem('bingo-cards')!)
      expect(stored).toHaveLength(1)
      expect(stored[0].name).toBe('Persisted')
    })

    it('removes a card by id', () => {
      state.addCard('ToRemove', grid)
      const id = state.cards.value[0]!.id
      state.removeCard(id)
      expect(state.cards.value).toHaveLength(0)
    })

    it('updates a card', () => {
      state.addCard('Old Name', grid)
      const id = state.cards.value[0]!.id
      const newGrid = grid.map((row) => [...row])
      newGrid[0]![0] = 15
      state.updateCard(id, 'New Name', newGrid)

      expect(state.cards.value[0]!.name).toBe('New Name')
      expect(state.cards.value[0]!.grid[0]![0]).toBe(15)
    })
  })

  // ── generateRandomGrid ──

  describe('generateRandomGrid', () => {
    it('returns a 5x5 grid', () => {
      const grid = state.generateRandomGrid()
      expect(grid).toHaveLength(5)
      for (const row of grid) {
        expect(row).toHaveLength(5)
      }
    })

    it('has FREE center (null at [2][2])', () => {
      const grid = state.generateRandomGrid()
      expect(grid[2]![2]).toBeNull()
    })

    it('has correct column ranges', () => {
      const grid = state.generateRandomGrid()
      const ranges = [
        [1, 15],
        [16, 30],
        [31, 45],
        [46, 60],
        [61, 75],
      ]
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 5; row++) {
          const cell = grid[row]![col]
          if (cell === null) continue // FREE
          expect(cell).toBeGreaterThanOrEqual(ranges[col]![0]!)
          expect(cell).toBeLessThanOrEqual(ranges[col]![1]!)
        }
      }
    })

    it('has no duplicate numbers within a column', () => {
      const grid = state.generateRandomGrid()
      for (let col = 0; col < 5; col++) {
        const nums = []
        for (let row = 0; row < 5; row++) {
          const cell = grid[row]![col]
          if (cell !== null) nums.push(cell)
        }
        expect(new Set(nums).size).toBe(nums.length)
      }
    })
  })

  // ── Game modes & win detection ──

  describe('game modes', () => {
    it('defaults to completo', () => {
      expect(state.activeGameMode.value).toBe('completo')
    })

    it('changes game mode', () => {
      state.setGameMode('L')
      expect(state.activeGameMode.value).toBe('L')
      expect(localStorage.getItem('bingo-gamemode')).toBe('L')
    })

    it('getActivePattern returns the correct pattern', () => {
      state.setGameMode('X')
      const pattern = state.getActivePattern()
      expect(pattern.id).toBe('X')
      expect(pattern.cells).toHaveLength(9)
    })

    it('isCellInPattern checks correctly for L pattern', () => {
      state.setGameMode('L')
      // Left column cells are in pattern
      expect(state.isCellInPattern(0, 0)).toBe(true)
      expect(state.isCellInPattern(4, 0)).toBe(true)
      // Bottom row cells are in pattern
      expect(state.isCellInPattern(4, 4)).toBe(true)
      // Top-right is not in L pattern
      expect(state.isCellInPattern(0, 4)).toBe(false)
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
      expect(state.checkCardWin(card)).toBe(false)
    })

    it('wins in L mode when left column + bottom row are called', () => {
      state.setGameMode('L')
      const grid = makeGrid()
      // L pattern: left column (1,2,3,4,5) + bottom row excluding col 0 (20,35,50,65)
      const needed = [1, 2, 3, 4, 5, 20, 35, 50, 65]
      for (const n of needed) state.toggleNumber(n)

      const card = { id: '1', name: 'Test', grid }
      expect(state.checkCardWin(card)).toBe(true)
    })

    it('does not win in L mode when missing one number', () => {
      state.setGameMode('L')
      const grid = makeGrid()
      const needed = [1, 2, 3, 4, 5, 20, 35, 50] // missing 65
      for (const n of needed) state.toggleNumber(n)

      const card = { id: '1', name: 'Test', grid }
      expect(state.checkCardWin(card)).toBe(false)
    })

    it('wins in X mode when both diagonals are called', () => {
      state.setGameMode('X')
      const grid = makeGrid()
      // X pattern diagonals: (0,0)=1, (1,1)=17, (2,2)=null(FREE), (3,3)=49, (4,4)=65
      //                      (0,4)=61, (1,3)=47, (3,1)=19, (4,0)=5
      const needed = [1, 17, 49, 65, 61, 47, 19, 5]
      for (const n of needed) state.toggleNumber(n)

      const card = { id: '1', name: 'Test', grid }
      expect(state.checkCardWin(card)).toBe(true)
    })

    it('wins in completo mode when all card numbers are called', () => {
      state.setGameMode('completo')
      const grid = makeGrid()
      // Call every non-null cell
      for (const row of grid) {
        for (const cell of row) {
          if (cell !== null) state.toggleNumber(cell)
        }
      }
      const card = { id: '1', name: 'Test', grid }
      expect(state.checkCardWin(card)).toBe(true)
    })

    it('getWinningCards returns only winning cards', () => {
      state.setGameMode('L')
      const winGrid = makeGrid()
      const loseGrid: (number | null)[][] = [
        [10, 25, 40, 55, 70],
        [11, 26, 41, 56, 71],
        [12, 27, null, 57, 72],
        [13, 28, 43, 58, 73],
        [14, 29, 44, 59, 74],
      ]

      state.addCard('Winner', winGrid)
      state.addCard('Loser', loseGrid)

      // Call numbers for the first card's L pattern
      for (const n of [1, 2, 3, 4, 5, 20, 35, 50, 65]) state.toggleNumber(n)

      const winners = state.getWinningCards()
      expect(winners).toHaveLength(1)
      expect(winners[0]!.name).toBe('Winner')
    })
  })

  // ── Helpers ──

  describe('helpers', () => {
    it('getLetterForNumber maps correctly', () => {
      expect(state.getLetterForNumber(1)).toBe('B')
      expect(state.getLetterForNumber(15)).toBe('B')
      expect(state.getLetterForNumber(16)).toBe('I')
      expect(state.getLetterForNumber(30)).toBe('I')
      expect(state.getLetterForNumber(31)).toBe('N')
      expect(state.getLetterForNumber(45)).toBe('N')
      expect(state.getLetterForNumber(46)).toBe('G')
      expect(state.getLetterForNumber(60)).toBe('G')
      expect(state.getLetterForNumber(61)).toBe('O')
      expect(state.getLetterForNumber(75)).toBe('O')
    })

    it('getColorForNumber returns correct column color', () => {
      expect(state.getColorForNumber(1)).toBe('#e74c3c')  // B red
      expect(state.getColorForNumber(20)).toBe('#f39c12') // I orange
      expect(state.getColorForNumber(35)).toBe('#2ecc71') // N green
      expect(state.getColorForNumber(50)).toBe('#3498db') // G blue
      expect(state.getColorForNumber(70)).toBe('#9b59b6') // O purple
    })

    it('getColorForColumn returns correct color by index', () => {
      expect(state.getColorForColumn(0)).toBe('#e74c3c')
      expect(state.getColorForColumn(4)).toBe('#9b59b6')
    })

    it('columns has 5 BINGO columns with correct ranges', () => {
      expect(state.columns).toHaveLength(5)
      expect(state.columns.map((c) => c.letter)).toEqual(['B', 'I', 'N', 'G', 'O'])
      expect(state.columns[0]!.start).toBe(1)
      expect(state.columns[0]!.end).toBe(15)
      expect(state.columns[4]!.start).toBe(61)
      expect(state.columns[4]!.end).toBe(75)
    })
  })

  // ── gameModes export ──

  describe('gameModes', () => {
    it('has 5 game modes', () => {
      expect(gameModes).toHaveLength(5)
    })

    it('completo covers all 25 cells', () => {
      const completo = gameModes.find((m) => m.id === 'completo')!
      expect(completo.cells).toHaveLength(25)
    })

    it('L has 9 cells', () => {
      const L = gameModes.find((m) => m.id === 'L')!
      expect(L.cells).toHaveLength(9)
    })

    it('U has 13 cells', () => {
      const U = gameModes.find((m) => m.id === 'U')!
      expect(U.cells).toHaveLength(13)
    })

    it('O has 16 cells (border)', () => {
      const O = gameModes.find((m) => m.id === 'O')!
      expect(O.cells).toHaveLength(16)
    })

    it('X has 9 cells (diagonals)', () => {
      const X = gameModes.find((m) => m.id === 'X')!
      expect(X.cells).toHaveLength(9)
    })
  })
})
