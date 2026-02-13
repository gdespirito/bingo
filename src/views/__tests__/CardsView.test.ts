import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createUnhead, headSymbol } from '@unhead/vue'
import CardsView from '../CardsView.vue'
import { useBingoState } from '@/composables/useBingoState'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/cartones', component: CardsView }],
  })
}

function mountCardsView() {
  const router = createTestRouter()
  const head = createUnhead()
  return mount(CardsView, {
    global: {
      plugins: [router],
      provide: { [headSymbol]: head },
    },
  })
}

const sampleGrid: (number | null)[][] = [
  [1, 16, 31, 46, 61],
  [2, 17, 32, 47, 62],
  [3, 18, null, 48, 63],
  [4, 19, 34, 49, 64],
  [5, 20, 35, 50, 65],
]

describe('CardsView', () => {
  beforeEach(() => {
    const state = useBingoState()
    state.resetBoard()
    while (state.cards.value.length > 0) {
      state.removeCard(state.cards.value[0]!.id)
    }
    state.setGameMode('completo')
  })

  it('shows empty state when no cards', () => {
    const wrapper = mountCardsView()
    expect(wrapper.text()).toContain('No tienes cartones guardados')
  })

  it('shows "Nuevo Cartón" button', () => {
    const wrapper = mountCardsView()
    const btn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Nuevo Cartón'))
    expect(btn).toBeDefined()
  })

  it('opens card editor when "Nuevo Cartón" is clicked', async () => {
    const wrapper = mountCardsView()
    const btn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Nuevo Cartón'))!

    await btn.trigger('click')
    await wrapper.vm.$nextTick()

    // Editor should now be visible — it has save/cancel buttons
    expect(wrapper.text()).toContain('Guardar')
    expect(wrapper.text()).toContain('Cancelar')
  })

  it('renders cards when they exist', () => {
    const state = useBingoState()
    state.addCard('Mi Cartón', sampleGrid)

    const wrapper = mountCardsView()
    expect(wrapper.text()).toContain('Mi Cartón')
    expect(wrapper.text()).not.toContain('No tienes cartones guardados')
  })

  it('renders multiple cards', () => {
    const state = useBingoState()
    state.addCard('Cartón 1', sampleGrid)
    state.addCard('Cartón 2', sampleGrid)

    const wrapper = mountCardsView()
    expect(wrapper.text()).toContain('Cartón 1')
    expect(wrapper.text()).toContain('Cartón 2')
  })

  it('shows edit and delete buttons for each card', () => {
    const state = useBingoState()
    state.addCard('Test', sampleGrid)

    const wrapper = mountCardsView()
    const editBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Editar'))
    const deleteBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Eliminar'))
    expect(editBtn).toBeDefined()
    expect(deleteBtn).toBeDefined()
  })

  it('shows BINGO column headers in card preview', () => {
    const state = useBingoState()
    state.addCard('Test', sampleGrid)

    const wrapper = mountCardsView()
    for (const letter of ['B', 'I', 'N', 'G', 'O']) {
      expect(wrapper.html()).toContain(letter)
    }
  })

  it('card preview shows progress counter', () => {
    const state = useBingoState()
    state.addCard('Test', sampleGrid)

    const wrapper = mountCardsView()
    // In completo mode: 0/25 initially (FREE counts as called, so 1/25)
    expect(wrapper.text()).toMatch(/\d+\s*\/\s*25/)
  })
})
