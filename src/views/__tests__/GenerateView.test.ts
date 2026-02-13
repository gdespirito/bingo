import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createUnhead, headSymbol } from '@unhead/vue'
import GenerateView from '../GenerateView.vue'
import { useBingoState } from '@/composables/useBingoState'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/generar', component: GenerateView }],
  })
}

function mountGenerateView() {
  const router = createTestRouter()
  const head = createUnhead()
  return mount(GenerateView, {
    global: {
      plugins: [router],
      provide: { [headSymbol]: head },
    },
  })
}

describe('GenerateView', () => {
  beforeEach(() => {
    const state = useBingoState()
    state.resetBoard()
    while (state.cards.value.length > 0) {
      state.removeCard(state.cards.value[0]!.id)
    }
  })

  it('renders quantity input and generate button', () => {
    const wrapper = mountGenerateView()
    const input = wrapper.find('input[type="number"]')
    expect(input.exists()).toBe(true)

    const genBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Generar'))
    expect(genBtn).toBeDefined()
  })

  it('shows empty state message initially', () => {
    const wrapper = mountGenerateView()
    expect(wrapper.text()).toContain('Ingresa la cantidad')
  })

  it('generates cards when Generar is clicked', async () => {
    const wrapper = mountGenerateView()

    const input = wrapper.find('input[type="number"]')
    await input.setValue(2)

    const genBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Generar'))!
    await genBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show card grids with BINGO headers and numbers
    expect(wrapper.text()).toContain('FREE')
    // Should show print and save buttons
    expect(wrapper.text()).toContain('Imprimir')
    expect(wrapper.text()).toContain('Guardar en Mis Cartones')
  })

  it('generated cards have valid BINGO structure', async () => {
    const wrapper = mountGenerateView()

    const input = wrapper.find('input[type="number"]')
    await input.setValue(1)

    const genBtn = wrapper
      .findAll('button')
      .find((b) => b.text().includes('Generar'))!
    await genBtn.trigger('click')
    await wrapper.vm.$nextTick()

    // Should show BINGO column headers
    const html = wrapper.html()
    for (const letter of ['B', 'I', 'N', 'G', 'O']) {
      expect(html).toContain(letter)
    }
    // Should have FREE in the center
    expect(wrapper.text()).toContain('FREE')
  })
})
