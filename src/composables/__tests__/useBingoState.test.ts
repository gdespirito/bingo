import { describe, it, expect, beforeEach } from 'vitest'
import { useBingoState, gameModes } from '../useBingoState'

describe('useBingoState (facade)', () => {
  let state: ReturnType<typeof useBingoState>

  beforeEach(() => {
    state = useBingoState()
    state.resetBoard()
    while (state.cards.value.length > 0) {
      state.removeCard(state.cards.value[0]!.id)
    }
    state.setGameMode('completo')
  })

  it('exposes all called-numbers members', () => {
    expect(state.calledNumbers).toBeDefined()
    expect(state.lastCalled).toBeDefined()
    expect(state.history).toBeDefined()
    expect(state.totalCalled).toBeDefined()
    expect(state.toggleNumber).toBeTypeOf('function')
    expect(state.resetBoard).toBeTypeOf('function')
  })

  it('exposes all cards members', () => {
    expect(state.cards).toBeDefined()
    expect(state.addCard).toBeTypeOf('function')
    expect(state.removeCard).toBeTypeOf('function')
    expect(state.updateCard).toBeTypeOf('function')
    expect(state.generateRandomGrid).toBeTypeOf('function')
  })

  it('exposes all game-mode members', () => {
    expect(state.activeGameMode).toBeDefined()
    expect(state.gameModes).toBeDefined()
    expect(state.setGameMode).toBeTypeOf('function')
    expect(state.getActivePattern).toBeTypeOf('function')
    expect(state.isCellInPattern).toBeTypeOf('function')
    expect(state.checkCardWin).toBeTypeOf('function')
    expect(state.getWinningCards).toBeTypeOf('function')
  })

  it('exposes all column helpers', () => {
    expect(state.columns).toHaveLength(5)
    expect(state.getLetterForNumber).toBeTypeOf('function')
    expect(state.getColorForNumber).toBeTypeOf('function')
    expect(state.getColorForColumn).toBeTypeOf('function')
  })

  it('exports gameModes at module level', () => {
    expect(gameModes).toHaveLength(5)
  })

  it('cross-composable: toggling numbers affects win detection', () => {
    state.setGameMode('L')
    const grid: (number | null)[][] = [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, null, 48, 63],
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ]
    state.addCard('Cross Test', grid)

    // Not winning yet
    expect(state.getWinningCards()).toHaveLength(0)

    // Call all L-pattern numbers
    for (const n of [1, 2, 3, 4, 5, 20, 35, 50, 65]) state.toggleNumber(n)

    expect(state.getWinningCards()).toHaveLength(1)
    expect(state.getWinningCards()[0]!.name).toBe('Cross Test')
  })

  it('cross-composable: reset clears win state', () => {
    state.setGameMode('L')
    const grid: (number | null)[][] = [
      [1, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, null, 48, 63],
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ]
    state.addCard('Reset Test', grid)

    for (const n of [1, 2, 3, 4, 5, 20, 35, 50, 65]) state.toggleNumber(n)
    expect(state.getWinningCards()).toHaveLength(1)

    state.resetBoard()
    expect(state.getWinningCards()).toHaveLength(0)
  })
})
