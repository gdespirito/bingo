<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@unhead/vue'

useHead({
  title: 'Generar Cartones de Bingo para Imprimir Gratis | Bingoo',
  meta: [
    { name: 'description', content: 'Genera cartones de bingo aleatorios gratis y listos para imprimir. Hasta 100 cartones por hoja en formato carta.' },
    { property: 'og:title', content: 'Generar Cartones de Bingo para Imprimir Gratis | Bingoo' },
    { property: 'og:description', content: 'Genera cartones de bingo aleatorios gratis y listos para imprimir. Hasta 100 cartones por hoja en formato carta.' },
    { property: 'og:url', content: 'https://bingoo.app/generar' },
  ],
})
import { useBingoState } from '@/composables/useBingoState'

const { generateRandomGrid, addCard, columns } = useBingoState()

const count = ref(4)
const generatedCards = ref<{ id: number; grid: (number | null)[][] }[]>([])

function generate() {
  const cards: { id: number; grid: (number | null)[][] }[] = []
  for (let i = 0; i < count.value; i++) {
    cards.push({ id: i + 1, grid: generateRandomGrid() })
  }
  generatedCards.value = cards
}

function printCards() {
  window.print()
}

function saveToMyCards() {
  if (!confirm(`¿Guardar ${generatedCards.value.length} cartones en "Mis Cartones"?`)) return
  for (const card of generatedCards.value) {
    addCard(`Cartón #${card.id}`, card.grid)
  }
  alert(`${generatedCards.value.length} cartones guardados.`)
}
</script>

<template>
  <div>
    <!-- Controls (hidden when printing) -->
    <div class="print:hidden mb-6 flex flex-wrap items-end gap-3 justify-center">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold uppercase tracking-wider text-slate-500">Cantidad</label>
        <input
          v-model.number="count"
          type="number"
          min="1"
          max="100"
          class="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-slate-100 outline-none focus:border-slate-500"
        />
      </div>
      <button
        @click="generate"
        class="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
      >
        Generar
      </button>
      <button
        v-if="generatedCards.length"
        @click="printCards"
        class="cursor-pointer rounded-lg bg-slate-700 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-600"
      >
        Imprimir
      </button>
      <button
        v-if="generatedCards.length"
        @click="saveToMyCards"
        class="cursor-pointer rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500"
      >
        Guardar en Mis Cartones
      </button>
    </div>

    <!-- Empty state -->
    <p v-if="!generatedCards.length" class="print:hidden text-center text-slate-600 text-sm">
      Ingresa la cantidad de cartones y presiona "Generar".
    </p>

    <!-- Cards grid -->
    <div v-if="generatedCards.length" class="print-cards-container">
      <div
        v-for="(card, idx) in generatedCards"
        :key="idx"
        class="print-card rounded-xl bg-slate-900 p-3 sm:p-4"
      >
        <!-- Card ID -->
        <div class="mb-1 text-right text-[0.6rem] font-mono text-slate-600 print-card-id">
          #{{ card.id }}
        </div>

        <!-- BINGO header -->
        <div class="grid grid-cols-5 gap-px mb-px">
          <div
            v-for="col in columns"
            :key="col.letter"
            class="flex items-center justify-center py-1.5 text-lg font-black text-white rounded-t-md print-header-cell"
            :style="{ backgroundColor: col.color }"
          >
            {{ col.letter }}
          </div>
        </div>

        <!-- 5x5 grid -->
        <div class="grid grid-cols-5 gap-px bg-slate-700 border border-slate-700 print-grid">
          <template v-for="(row, rIdx) in card.grid" :key="rIdx">
            <div
              v-for="(cell, cIdx) in row"
              :key="`${rIdx}-${cIdx}`"
              class="flex items-center justify-center bg-slate-800 py-2.5 text-base font-bold text-slate-100 print-cell"
            >
              <template v-if="cell === null">
                <span class="text-xs font-black text-slate-500 print-free">FREE</span>
              </template>
              <template v-else>
                {{ cell }}
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Screen layout: responsive grid */
.print-cards-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 500px) {
  .print-cards-container {
    grid-template-columns: 1fr;
  }
}

/* ── Print styles ── */
@media print {
  .print-cards-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0;
    padding: 0;
    margin: 0;
  }

  .print-card {
    background: white !important;
    color: black !important;
    border-radius: 0 !important;
    padding: 8mm !important;
    box-sizing: border-box;
    width: 100%;
    height: 50vh;
    display: flex;
    flex-direction: column;
    border: 1px dashed #999 !important;
    break-inside: avoid;
  }

  .print-card-id {
    color: #666 !important;
  }

  .print-header-cell {
    background: black !important;
    color: white !important;
    border-radius: 0 !important;
    padding: 4px 0 !important;
    font-size: 1.1rem !important;
  }

  .print-grid {
    background: black !important;
    border-color: black !important;
    flex: 1;
  }

  .print-cell {
    background: white !important;
    color: black !important;
    font-size: 1.2rem !important;
    border: 1px solid black !important;
  }

  .print-free {
    color: #333 !important;
    font-size: 0.75rem !important;
  }

  /* 4 cards per page */
  .print-card:nth-child(4n + 1) {
    break-before: page;
  }
  /* Don't break before the very first card */
  .print-card:first-child {
    break-before: auto;
  }
}
</style>
