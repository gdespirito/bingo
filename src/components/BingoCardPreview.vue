<script setup lang="ts">
import { useBingoState, type BingoCard } from '@/composables/useBingoState'

const props = defineProps<{ card: BingoCard }>()
const emit = defineEmits<{
  edit: [card: BingoCard]
  delete: [id: string]
}>()

const {
  calledNumbers,
  columns,
  getColorForColumn,
  getActivePattern,
  isCellInPattern,
  checkCardWin,
} = useBingoState()

function isFreeCell(row: number, col: number): boolean { return row === 2 && col === 2 }

function isCalled(num: number | null): boolean {
  return num === null || calledNumbers.value.has(num)
}

function cardCalledCount(): number {
  const pattern = getActivePattern()
  let count = 0
  for (const [r, c] of pattern.cells) {
    const cell = props.card.grid[r]![c]
    if (cell === null || cell === undefined || calledNumbers.value.has(cell)) count++
  }
  return count
}
</script>

<template>
  <div
    class="rounded-2xl border-2 bg-slate-900 p-4 transition-all"
    :class="checkCardWin(card)
      ? 'border-green-500 animate-[win-pulse_2s_ease_infinite]'
      : 'border-slate-800'"
  >
    <!-- Winner banner -->
    <div
      v-if="checkCardWin(card)"
      class="animate-[banner-pop_0.4s_ease] pb-2.5 pt-1.5 text-center text-2xl font-black tracking-[0.2em] text-green-500"
    >
      BINGO!
    </div>

    <div class="mb-3 flex items-center justify-between">
      <span class="font-bold text-slate-100">{{ card.name }}</span>
      <span class="rounded-lg bg-slate-950 px-2.5 py-1 text-sm font-bold text-slate-500">
        {{ cardCalledCount() }} / {{ getActivePattern().cells.length }}
      </span>
    </div>

    <!-- Mini bingo grid -->
    <div class="mb-3">
      <div class="mb-1 grid grid-cols-5 gap-1">
        <div
          v-for="(col, ci) in columns"
          :key="ci"
          class="rounded-md py-1 text-center text-sm font-black text-white"
          :style="{ background: col.color }"
        >
          {{ col.letter }}
        </div>
      </div>
      <div v-for="(row, ri) in card.grid" :key="ri" class="mb-1 grid grid-cols-5 gap-1">
        <div
          v-for="(cell, ci) in row"
          :key="ci"
          class="rounded-lg border-2 py-2 text-center text-sm font-bold transition-all max-sm:py-1.5 max-sm:text-xs"
          :class="{
            'text-white border-transparent shadow-md': isCalled(cell) && isCellInPattern(ri, ci),
            'opacity-30': !isCellInPattern(ri, ci),
            'outline-1 outline-dashed outline-slate-500/25 -outline-offset-1': isCellInPattern(ri, ci) && !(isCalled(cell) && isCellInPattern(ri, ci)),
            'bg-slate-950 border-slate-800 text-slate-600': !isCalled(cell) || !isCellInPattern(ri, ci),
            '!text-[0.65rem] !font-extrabold tracking-wide': isFreeCell(ri, ci),
          }"
          :style="
            isCalled(cell) && isCellInPattern(ri, ci) && cell !== null
              ? { background: getColorForColumn(ci), borderColor: getColorForColumn(ci) }
              : isFreeCell(ri, ci) && isCellInPattern(ri, ci)
                ? { background: '#475569', borderColor: '#475569' }
                : isFreeCell(ri, ci)
                  ? { background: '#334155', borderColor: '#334155' }
                  : {}
          "
        >
          <template v-if="isFreeCell(ri, ci)">FREE</template>
          <template v-else>{{ cell ?? '' }}</template>
        </div>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-900 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-blue-600 hover:text-blue-400"
        @click="emit('edit', card)"
      >
        Editar
      </button>
      <button
        class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-900 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-red-600 hover:text-red-400"
        @click="emit('delete', card.id)"
      >
        Eliminar
      </button>
    </div>
  </div>
</template>
