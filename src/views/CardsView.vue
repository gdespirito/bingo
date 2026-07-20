<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Cartones de Bingo Personalizados | Bingoo',
  meta: [
    { name: 'description', content: 'Crea y gestiona tus cartones de bingo. Sube una foto y extrae los números automáticamente con inteligencia artificial.' },
    { property: 'og:title', content: 'Cartones de Bingo Personalizados | Bingoo' },
    { property: 'og:description', content: 'Crea y gestiona tus cartones de bingo. Sube una foto y extrae los números automáticamente con inteligencia artificial.' },
    { property: 'og:url', content: 'https://bingoo.app/cartones' },
  ],
})
import { useBingoState, type BingoCard } from '@/composables/useBingoState'
import { track } from '@/analytics'
import BingoCardPreview from '@/components/BingoCardPreview.vue'
import CardEditor from '@/components/CardEditor.vue'
import ApiKeyModal from '@/components/ApiKeyModal.vue'

const { cards, addCard, removeCard, updateCard, getWinningCards, activeGameMode } = useBingoState()

// Dispara `bingo_detectado` una sola vez por cartón que pasa a ganador.
const winningIds = computed(() => getWinningCards().map((c) => c.id))
const notifiedWins = new Set<string>()
watch(
  winningIds,
  (ids) => {
    for (const id of ids) {
      if (!notifiedWins.has(id)) {
        notifiedWins.add(id)
        track('bingo_detectado', { carton_id: id, modo: activeGameMode.value })
      }
    }
  },
  { immediate: true },
)

const APIKEY_STORAGE = 'bingo-openai-key'
const apiKey = ref(localStorage.getItem(APIKEY_STORAGE) ?? '')
const showApiKeyInput = ref(false)
const apiKeyModal = ref<InstanceType<typeof ApiKeyModal> | null>(null)

const showEditor = ref(false)
const editingCard = ref<BingoCard | null>(null)

function openNewCard() {
  editingCard.value = null
  showEditor.value = true
}

function openEditCard(card: BingoCard) {
  editingCard.value = card
  showEditor.value = true
}

function saveCard(name: string, grid: (number | null)[][]) {
  if (editingCard.value) {
    updateCard(editingCard.value.id, name, grid)
    track('carton_editado', { id: editingCard.value.id })
  } else {
    addCard(name, grid)
    track('carton_creado', { origen: 'editor', total_cartones: cards.value.length })
  }
  showEditor.value = false
}

function confirmDelete(id: string) {
  if (confirm('Eliminar este cartón?')) {
    removeCard(id)
    track('carton_eliminado', { total_cartones: cards.value.length })
  }
}

function syncApiKey() {
  apiKey.value = localStorage.getItem(APIKEY_STORAGE) ?? ''
}
</script>

<template>
  <div class="mx-auto max-w-[700px]">
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <h2 class="text-xl font-extrabold text-slate-300">Mis Cartones</h2>
      <button
        class="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700"
        @click="openNewCard"
      >
        + Nuevo Cartón
      </button>
    </div>

    <!-- Card list -->
    <div v-if="cards.length > 0 && !showEditor" class="flex flex-col gap-5">
      <BingoCardPreview
        v-for="card in cards"
        :key="card.id"
        :card="card"
        @edit="openEditCard"
        @delete="confirmDelete"
      />
    </div>

    <!-- Empty state -->
    <div v-if="cards.length === 0 && !showEditor" class="py-12 text-center text-slate-700 leading-relaxed">
      <p>No tienes cartones guardados.</p>
      <p>Agrega uno para seguir tus números.</p>
    </div>

    <ApiKeyModal ref="apiKeyModal" v-model="showApiKeyInput" @update:model-value="syncApiKey" />

    <CardEditor
      v-if="showEditor"
      :key="editingCard?.id ?? 'new'"
      :editing-card="editingCard"
      :api-key="apiKey"
      @save="saveCard"
      @cancel="showEditor = false"
      @api-key-needed="showApiKeyInput = true"
    />
  </div>
</template>
