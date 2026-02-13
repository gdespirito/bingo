import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createUnhead, headSymbol } from '@unhead/vue'
import BoardView from '../BoardView.vue'
import { useBingoState } from '@/composables/useBingoState'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: BoardView }],
  })
}

function mountBoardView() {
  const router = createTestRouter()
  const head = createUnhead()
  return mount(BoardView, {
    global: {
      plugins: [router],
      provide: { [headSymbol]: head },
    },
  })
}

describe('BoardView', () => {
  beforeEach(() => {
    const { resetBoard } = useBingoState()
    resetBoard()
  })

  it('renders 75 number buttons', () => {
    const wrapper = mountBoardView()
    // 5 column headers (B, I, N, G, O) + 75 number buttons = 80 buttons total
    // plus the "Sacar número" button, "Cancelar"/"Reiniciar", sound toggle, etc.
    const numberButtons = wrapper
      .findAll('button')
      .filter((btn) => {
        const text = btn.text().trim()
        return /^\d+$/.test(text) && Number(text) >= 1 && Number(text) <= 75
      })
    expect(numberButtons).toHaveLength(75)
  })

  it('renders BINGO column headers', () => {
    const wrapper = mountBoardView()
    const html = wrapper.html()
    for (const letter of ['B', 'I', 'N', 'G', 'O']) {
      expect(html).toContain(letter)
    }
  })

  it('toggles a number when clicked', async () => {
    const wrapper = mountBoardView()
    const { calledNumbers } = useBingoState()

    // Find button with number 42
    const btn42 = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === '42')!
    expect(btn42).toBeDefined()

    await btn42.trigger('click')
    expect(calledNumbers.value.has(42)).toBe(true)

    // Click again to untoggle
    await btn42.trigger('click')
    expect(calledNumbers.value.has(42)).toBe(false)
  })

  it('shows called count as 0/75 initially', () => {
    const wrapper = mountBoardView()
    expect(wrapper.html()).toContain('0')
    expect(wrapper.html()).toContain('/75')
  })

  it('updates called count after toggling numbers', async () => {
    const wrapper = mountBoardView()
    const btn1 = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === '1')!

    await btn1.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.html()).toContain('1')
    expect(wrapper.html()).toContain('/75')
  })

  it('shows Reiniciar button', () => {
    const wrapper = mountBoardView()
    const resetBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Reiniciar'))
    expect(resetBtn).toBeDefined()
  })

  it('shows Sacar número button', () => {
    const wrapper = mountBoardView()
    const drawBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Sacar número'))
    expect(drawBtn).toBeDefined()
  })

  it('resets board when Reiniciar is clicked', async () => {
    const wrapper = mountBoardView()
    const { calledNumbers } = useBingoState()

    // Call a number first
    const btn5 = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === '5')!
    await btn5.trigger('click')
    expect(calledNumbers.value.size).toBe(1)

    // Click reset
    const resetBtn = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Reiniciar'))!
    await resetBtn.trigger('click')
    expect(calledNumbers.value.size).toBe(0)
  })
})
