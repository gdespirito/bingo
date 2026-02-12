<script setup lang="ts">
import { useAudioRecorder } from '@/composables/useAudioRecorder'
import { useBingoState } from '@/composables/useBingoState'

const { getLetterForNumber, getColorForNumber, columns } = useBingoState()
const {
  recordings,
  currentNumber,
  status,
  exportProgress,
  recordedCount,
  toggleRecording,
  goToNumber,
  playRecording,
  deleteRecording,
  exportZip,
} = useAudioRecorder()

function getNumbers(start: number, end: number): number[] {
  const nums: number[] = []
  for (let i = start; i <= end; i++) nums.push(i)
  return nums
}
</script>

<template>
  <div class="mx-auto max-w-[700px]">
    <!-- Current number display -->
    <div class="mb-5 flex flex-col items-center gap-2">
      <div
        class="flex h-28 w-28 items-center justify-center rounded-2xl text-5xl font-black text-white shadow-lg sm:h-32 sm:w-32 sm:text-6xl"
        :style="{ background: getColorForNumber(currentNumber), boxShadow: '0 0 40px ' + getColorForNumber(currentNumber) + '40' }"
      >
        {{ currentNumber }}
      </div>
      <div class="text-lg font-bold" :style="{ color: getColorForNumber(currentNumber) }">
        {{ getLetterForNumber(currentNumber) }}-{{ currentNumber }}
      </div>
      <div class="text-sm font-semibold text-slate-500">
        {{ recordedCount }} / 75 grabados
      </div>
    </div>

    <!-- Status bar -->
    <div
      class="mb-4 flex min-h-[42px] items-center justify-center gap-3 rounded-lg border-2 px-4 py-2 transition-all"
      :class="{
        'border-red-500 bg-[#2d1f1f] shadow-[0_0_20px_rgba(239,68,68,0.15)]': status === 'recording',
        'border-slate-800 bg-slate-900': status === 'idle',
        'border-blue-600 bg-slate-900': status === 'exporting',
      }"
    >
      <div v-if="status === 'recording'" class="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <span class="inline-block h-3 w-3 animate-[pulse-record_1s_ease_infinite] rounded-full bg-red-500"></span>
        <span>Grabando... (presiona espacio para detener)</span>
      </div>
      <div v-else-if="status === 'exporting'" class="flex w-full flex-col items-center gap-1.5">
        <span class="text-sm font-semibold text-slate-300">Exportando...</span>
        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            class="h-full rounded-full bg-blue-500 transition-all duration-200"
            :style="{ width: exportProgress + '%' }"
          ></div>
        </div>
      </div>
      <div v-else class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <span>Presiona <kbd class="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-500">espacio</kbd> para grabar</span>
        </div>
        <template v-if="recordings.has(currentNumber)">
          <span class="text-slate-700">|</span>
          <button
            class="cursor-pointer rounded-md border-none bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400 transition-all hover:bg-slate-700 hover:text-slate-200"
            @click="playRecording(currentNumber)"
          >
            &#9654; Reproducir
          </button>
          <button
            class="cursor-pointer rounded-md border-none bg-slate-800 px-2.5 py-1 text-xs font-semibold text-red-400 transition-all hover:bg-red-900/50 hover:text-red-300"
            @click="deleteRecording(currentNumber)"
          >
            &#10005; Eliminar
          </button>
        </template>
      </div>
    </div>

    <!-- Progress grid -->
    <div class="mb-4 grid grid-cols-5 gap-1 sm:gap-1.5">
      <div v-for="col in columns" :key="col.letter" class="flex flex-col gap-0.5 sm:gap-1">
        <div
          class="rounded-md py-1.5 text-center text-lg font-black text-white tracking-wide sm:rounded-lg sm:text-xl"
          :style="{ background: col.color }"
        >
          {{ col.letter }}
        </div>
        <button
          v-for="num in getNumbers(col.start, col.end)"
          :key="num"
          class="cursor-pointer select-none rounded-md border-2 py-1 text-center text-xs font-semibold transition-all sm:rounded-lg sm:py-1.5 sm:text-sm [-webkit-tap-highlight-color:transparent]"
          :class="[
            recordings.has(num)
              ? 'border-transparent text-white font-bold shadow-sm'
              : 'border-slate-800 bg-slate-900 text-slate-600',
            currentNumber === num && 'ring-2 ring-white ring-offset-1 ring-offset-slate-950',
          ]"
          :style="recordings.has(num) ? { background: col.color } : {}"
          @click="goToNumber(num)"
        >
          {{ num }}
        </button>
      </div>
    </div>

    <!-- Export button -->
    <div class="flex justify-center">
      <button
        class="cursor-pointer rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-all hover:scale-105 hover:shadow-indigo-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="recordedCount === 0 || status === 'exporting' || status === 'recording'"
        @click="exportZip()"
      >
        Exportar ZIP ({{ recordedCount }}/75)
      </button>
    </div>
  </div>
</template>
