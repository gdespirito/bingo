import { describe, it, expect } from 'vitest'
import { columns, getLetterForNumber, getColorForNumber, getColorForColumn } from '../useBingoColumns'

describe('useBingoColumns', () => {
  describe('columns', () => {
    it('has 5 BINGO columns', () => {
      expect(columns).toHaveLength(5)
    })

    it('letters are B, I, N, G, O in order', () => {
      expect(columns.map((c) => c.letter)).toEqual(['B', 'I', 'N', 'G', 'O'])
    })

    it('ranges cover 1-75 without gaps', () => {
      expect(columns[0]!.start).toBe(1)
      expect(columns[0]!.end).toBe(15)
      expect(columns[4]!.start).toBe(61)
      expect(columns[4]!.end).toBe(75)
    })
  })

  describe('getLetterForNumber', () => {
    it('maps B range (1-15)', () => {
      expect(getLetterForNumber(1)).toBe('B')
      expect(getLetterForNumber(15)).toBe('B')
    })

    it('maps I range (16-30)', () => {
      expect(getLetterForNumber(16)).toBe('I')
      expect(getLetterForNumber(30)).toBe('I')
    })

    it('maps N range (31-45)', () => {
      expect(getLetterForNumber(31)).toBe('N')
      expect(getLetterForNumber(45)).toBe('N')
    })

    it('maps G range (46-60)', () => {
      expect(getLetterForNumber(46)).toBe('G')
      expect(getLetterForNumber(60)).toBe('G')
    })

    it('maps O range (61-75)', () => {
      expect(getLetterForNumber(61)).toBe('O')
      expect(getLetterForNumber(75)).toBe('O')
    })
  })

  describe('getColorForNumber', () => {
    it('returns red for B column', () => {
      expect(getColorForNumber(1)).toBe('#e74c3c')
    })

    it('returns orange for I column', () => {
      expect(getColorForNumber(20)).toBe('#f39c12')
    })

    it('returns green for N column', () => {
      expect(getColorForNumber(35)).toBe('#2ecc71')
    })

    it('returns blue for G column', () => {
      expect(getColorForNumber(50)).toBe('#3498db')
    })

    it('returns purple for O column', () => {
      expect(getColorForNumber(70)).toBe('#9b59b6')
    })
  })

  describe('getColorForColumn', () => {
    it('returns correct color by index', () => {
      expect(getColorForColumn(0)).toBe('#e74c3c')
      expect(getColorForColumn(4)).toBe('#9b59b6')
    })

    it('returns fallback for out-of-range index', () => {
      expect(getColorForColumn(99)).toBe('#888')
    })
  })
})
