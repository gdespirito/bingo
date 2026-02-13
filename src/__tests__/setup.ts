import { beforeEach, vi } from 'vitest'

// heic2any uses Web Workers which are not available in happy-dom
vi.mock('heic2any', () => ({ default: vi.fn() }))

beforeEach(() => {
  localStorage.clear()
})
