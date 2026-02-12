<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useBingoState, type BingoCard } from '@/composables/useBingoState'
import { useCardOcr } from '@/composables/useCardOcr'

const props = defineProps<{
  editingCard: BingoCard | null
  apiKey: string
}>()

const emit = defineEmits<{
  save: [name: string, grid: (number | null)[][]]
  cancel: []
  apiKeyNeeded: []
}>()

const { columns } = useBingoState()

const cardName = ref(props.editingCard?.name ?? '')
const grid = ref<(number | null)[][]>(
  props.editingCard
    ? props.editingCard.grid.map((row) => [...row])
    : emptyGrid(),
)

const { photoLoading, photoError, fileInput, triggerFileUpload, onFileSelected } =
  useCardOcr(toRef(props, 'apiKey'), grid, () => emit('apiKeyNeeded'))

function emptyGrid(): (number | null)[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null))
}

function isFreeCell(row: number, col: number): boolean { return row === 2 && col === 2 }

function onCellInput(row: number, col: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = parseInt(input.value)
  grid.value[row]![col] = isNaN(val) || val < 1 || val > 75 ? null : val
}

function colRange(ci: number): string { return `${columns[ci]!.start}-${columns[ci]!.end}` }
function colLetter(ci: number): string { return columns[ci]!.letter }

function save() {
  emit('save', cardName.value || 'Mi Carton', grid.value)
}
</script>

<template>
  <div class="animate-[fade-in_0.2s_ease]">
    <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h3 class="mb-4 text-lg font-extrabold text-slate-300">
        {{ editingCard ? 'Editar Carton' : 'Nuevo Carton' }}
      </h3>

      <!-- Name field -->
      <div class="mb-4">
        <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</label>
        <input
          v-model="cardName"
          type="text"
          placeholder="Ej: Carton #442"
          class="w-full rounded-lg border-2 border-slate-800 bg-slate-950 px-3.5 py-2.5 font-semibold text-slate-100 outline-none transition-colors focus:border-blue-600"
        />
      </div>

      <!-- Photo upload -->
      <div class="mb-2.5 flex gap-2">
        <input ref="fileInput" type="file" accept="image/*,.heic,.heif" capture="environment" class="hidden" @change="onFileSelected" />
        <button
          class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 px-4 py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          :disabled="photoLoading"
          @click="triggerFileUpload"
        >
          <template v-if="photoLoading">
            <span class="inline-block h-4 w-4 animate-[spin_0.6s_linear_infinite] rounded-full border-2 border-white/30 border-t-white"></span>
            Analizando foto...
          </template>
          <template v-else>&#128247; Cargar foto del carton</template>
        </button>
        <button
          class="w-11 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-950 text-lg text-slate-600 transition-all hover:border-slate-700 hover:text-slate-500"
          title="Configurar API Key"
          @click="emit('apiKeyNeeded')"
        >
          &#9881;
        </button>
      </div>
      <p v-if="photoError" class="mb-2.5 rounded-lg border border-red-600/20 bg-red-600/10 px-3 py-2 text-sm text-red-400">{{ photoError }}</p>

      <p class="mb-3 text-sm text-slate-600">O ingresa los numeros manualmente, fila por fila.</p>

      <!-- Edit grid -->
      <div class="mb-5">
        <div class="mb-1.5 grid grid-cols-5 gap-1.5">
          <div
            v-for="(col, ci) in columns"
            :key="ci"
            class="flex flex-col items-center rounded-lg py-1.5 text-center font-black text-white"
            :style="{ background: col.color }"
          >
            <span class="text-sm">{{ col.letter }}</span>
            <span class="text-[0.6rem] font-semibold opacity-70">{{ colRange(ci) }}</span>
          </div>
        </div>
        <div v-for="(row, ri) in grid" :key="ri" class="mb-1.5 grid grid-cols-5 gap-1.5">
          <div v-for="(_, ci) in row" :key="ci" class="flex">
            <div
              v-if="isFreeCell(ri, ci)"
              class="flex w-full items-center justify-center rounded-lg border-2 border-slate-700 bg-slate-700 py-2.5 text-[0.7rem] font-extrabold tracking-wide text-white"
            >
              FREE
            </div>
            <input
              v-else
              type="number"
              :min="columns[ci]!.start"
              :max="columns[ci]!.end"
              :placeholder="colLetter(ci)"
              :value="grid[ri]![ci] ?? ''"
              class="w-full rounded-lg border-2 border-slate-800 bg-slate-950 py-2.5 text-center text-lg font-bold text-slate-100 outline-none transition-colors placeholder:font-semibold placeholder:text-slate-800 focus:border-blue-600"
              @input="onCellInput(ri, ci, $event)"
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2.5">
        <button class="flex-1 cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700" @click="save">Guardar</button>
        <button class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-950 py-3 font-semibold text-slate-500 transition-all hover:border-slate-700 hover:text-slate-300" @click="emit('cancel')">Cancelar</button>
      </div>
    </div>
  </div>
</template>
