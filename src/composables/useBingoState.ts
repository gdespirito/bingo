import type { BingoCard, GameMode, GameModeInfo } from './useBingoState.types'
import { columns, getLetterForNumber, getColorForNumber, getColorForColumn } from './useBingoColumns'
import { calledNumbers, lastCalled, history, totalCalled, toggleNumber, resetBoard } from './useCalledNumbers'
import { cards, addCard, removeCard, updateCard, generateRandomGrid } from './useBingoCards'
import { gameModes, activeGameMode, setGameMode, getActivePattern, isCellInPattern, checkCardWin, getWinningCards } from './useGameModes'

export type { BingoCard, GameMode, GameModeInfo }
export { gameModes }

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
    // generation
    generateRandomGrid,
    // helpers
    columns,
    getLetterForNumber,
    getColorForNumber,
    getColorForColumn,
  }
}
