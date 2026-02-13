import { describe, it, expect, beforeEach } from 'vitest'
import { calledNumbers, lastCalled, history, totalCalled, toggleNumber, resetBoard } from '../useCalledNumbers'

describe('useCalledNumbers', () => {
  beforeEach(() => {
    resetBoard()
  })

  describe('toggleNumber', () => {
    it('adds a number to called numbers', () => {
      toggleNumber(42)
      expect(calledNumbers.value.has(42)).toBe(true)
      expect(lastCalled.value).toBe(42)
      expect(history.value).toContain(42)
    })

    it('removes a number when toggled again', () => {
      toggleNumber(42)
      toggleNumber(42)
      expect(calledNumbers.value.has(42)).toBe(false)
      expect(history.value).not.toContain(42)
    })

    it('updates lastCalled to previous number on untoggle', () => {
      toggleNumber(10)
      toggleNumber(25)
      toggleNumber(25)
      expect(lastCalled.value).toBe(10)
    })

    it('sets lastCalled to null when all numbers are untoggled', () => {
      toggleNumber(10)
      toggleNumber(10)
      expect(lastCalled.value).toBeNull()
    })

    it('tracks totalCalled correctly', () => {
      expect(totalCalled.value).toBe(0)
      toggleNumber(1)
      toggleNumber(75)
      expect(totalCalled.value).toBe(2)
      toggleNumber(1)
      expect(totalCalled.value).toBe(1)
    })

    it('persists to localStorage', () => {
      toggleNumber(33)
      const stored = JSON.parse(localStorage.getItem('bingo-state')!)
      expect(stored.history).toContain(33)
    })
  })

  describe('resetBoard', () => {
    it('clears all called numbers and history', () => {
      toggleNumber(1)
      toggleNumber(50)
      resetBoard()

      expect(calledNumbers.value.size).toBe(0)
      expect(lastCalled.value).toBeNull()
      expect(history.value).toHaveLength(0)
      expect(localStorage.getItem('bingo-state')).toBeNull()
    })
  })
})
