import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createUnhead, headSymbol } from '@unhead/vue'
import App from '../App.vue'
import BoardView from '../views/BoardView.vue'
import CardsView from '../views/CardsView.vue'
import GenerateView from '../views/GenerateView.vue'
import RecordView from '../views/RecordView.vue'
import { useBingoState } from '@/composables/useBingoState'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'board', component: BoardView },
      { path: '/cartones', name: 'cards', component: CardsView },
      { path: '/grabar', name: 'record', component: RecordView },
      { path: '/generar', name: 'generate', component: GenerateView },
    ],
  })
}

function mountApp() {
  const router = createTestRouter()
  const head = createUnhead()
  return { wrapper: mount(App, { global: { plugins: [router], provide: { [headSymbol]: head } } }), router }
}

describe('App navigation', () => {
  beforeEach(() => {
    const state = useBingoState()
    state.resetBoard()
    while (state.cards.value.length > 0) {
      state.removeCard(state.cards.value[0]!.id)
    }
    state.setGameMode('completo')
  })

  it('renders header with BINGO title', () => {
    const { wrapper } = mountApp()
    expect(wrapper.text()).toContain('BINGO')
  })

  it('renders navigation links', () => {
    const { wrapper } = mountApp()
    expect(wrapper.text()).toContain('Tablero')
    expect(wrapper.text()).toContain('Mis Cartones')
    expect(wrapper.text()).toContain('Grabar Audio')
    expect(wrapper.text()).toContain('Generar Cartones')
  })

  it('renders Compartir button', () => {
    const { wrapper } = mountApp()
    expect(wrapper.text()).toContain('Compartir')
  })

  it('navigates to /cartones when Mis Cartones is clicked', async () => {
    const { wrapper, router } = mountApp()
    router.push('/')
    await router.isReady()
    await flushPromises()

    const cardsLink = wrapper
      .findAll('a')
      .find((a) => a.text().includes('Mis Cartones'))!
    await cardsLink.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('cards')
    // Game mode selector should be visible on cards page
    expect(wrapper.text()).toContain('Modo de juego')
  })

  it('shows game mode selector only on cards page', async () => {
    const { wrapper, router } = mountApp()
    router.push('/')
    await router.isReady()
    await flushPromises()

    // Board page: no game mode selector
    expect(wrapper.text()).not.toContain('Modo de juego')

    // Navigate to cards
    await router.push('/cartones')
    await flushPromises()

    expect(wrapper.text()).toContain('Modo de juego')
  })

  it('can switch game mode on cards page', async () => {
    const { wrapper, router } = mountApp()
    await router.push('/cartones')
    await router.isReady()
    await flushPromises()

    const { activeGameMode } = useBingoState()
    expect(activeGameMode.value).toBe('completo')

    // Click the L mode button
    const lButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('L'))!
    await lButton.trigger('click')
    await flushPromises()

    expect(activeGameMode.value).toBe('L')
  })

  it('board and cards share the same state', async () => {
    const { wrapper, router } = mountApp()
    await router.push('/')
    await router.isReady()
    await flushPromises()

    // Toggle number 10 on the board
    const btn10 = wrapper
      .findAll('button')
      .find((btn) => btn.text().trim() === '10')!
    await btn10.trigger('click')
    await flushPromises()

    // Add a card and navigate to cards view
    const state = useBingoState()
    state.addCard('Shared State Test', [
      [10, 16, 31, 46, 61],
      [2, 17, 32, 47, 62],
      [3, 18, null, 48, 63],
      [4, 19, 34, 49, 64],
      [5, 20, 35, 50, 65],
    ])

    await router.push('/cartones')
    await flushPromises()

    // The card should reflect that number 10 is called
    expect(state.calledNumbers.value.has(10)).toBe(true)
    expect(wrapper.text()).toContain('Shared State Test')
  })
})
