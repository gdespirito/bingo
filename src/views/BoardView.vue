<script setup lang="ts">
import { useBingoState } from '@/composables/useBingoState'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'
import HistoryPanel from '@/components/HistoryPanel.vue'

const {
  calledNumbers,
  lastCalled,
  history,
  totalCalled,
  toggleNumber,
  resetBoard,
  columns,
  getLetterForNumber,
  getColorForNumber,
} = useBingoState()

function getNumbers(start: number, end: number): number[] {
  const nums: number[] = []
  for (let i = start; i <= end; i++) nums.push(i)
  return nums
}

const { speechStatus, speechText, recognizedNum } = useSpeechRecognition((num) => {
  if (!calledNumbers.value.has(num)) toggleNumber(num)
})
</script>

<template>
  <div class="mx-auto max-w-[700px]">
    <!-- Stats -->
    <div class="mb-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex flex-col items-center gap-1">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Último</span>
        <span
          v-if="lastCalled"
          class="min-w-[80px] animate-[pop-in_0.3s_ease] rounded-lg px-4 py-1.5 text-center text-xl font-black text-white"
          :style="{ background: getColorForNumber(lastCalled) }"
        >
          {{ getLetterForNumber(lastCalled) }}-{{ lastCalled }}
        </span>
        <span v-else class="min-w-[80px] rounded-lg bg-slate-900 px-4 py-1.5 text-center text-xl font-black text-slate-700">
          --
        </span>
      </div>
      <div class="flex flex-col items-center gap-1">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Llamados</span>
        <span class="text-lg font-bold text-slate-300">{{ totalCalled }} / 75</span>
      </div>
      <button
        class="cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-red-600 hover:bg-red-600 hover:text-white"
        @click="resetBoard"
      >
        Reiniciar
      </button>
    </div>

    <!-- Mic bar -->
    <div
      class="mb-4 flex min-h-[42px] items-center justify-center rounded-lg border-2 px-4 py-2 transition-all"
      :class="{
        'border-green-500 bg-[#1e3a2f] shadow-[0_0_20px_rgba(34,197,94,0.15)]': speechStatus === 'listening',
        'border-blue-600 bg-slate-900': speechStatus === 'success',
        'border-red-600 bg-[#2d1f1f]': speechStatus === 'error',
        'border-slate-800 bg-slate-900': speechStatus === 'idle',
      }"
    >
      <div v-if="speechStatus === 'listening'" class="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <span class="animate-[pulse-mic_1s_ease_infinite] text-lg">&#127908;</span>
        <span>Escuchando...</span>
      </div>
      <div v-else-if="speechStatus === 'success'" class="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <span class="text-lg">&#9989;</span>
        <span>"{{ speechText }}" &rarr; <strong>{{ recognizedNum }}</strong></span>
      </div>
      <div v-else-if="speechStatus === 'error'" class="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <span class="text-lg">&#10060;</span>
        <span>{{ speechText || 'No reconocido' }} &mdash; intenta de nuevo</span>
      </div>
      <div v-else class="flex items-center gap-2 text-sm font-semibold text-slate-600">
        <span class="text-lg">&#127908;</span>
        <span>Presiona <kbd class="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-500">espacio</kbd> para dictar un número</span>
      </div>
    </div>

    <!-- Board + History -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <!-- Board grid -->
      <div class="grid w-full grid-cols-5 gap-1 sm:min-w-0 sm:flex-1 sm:gap-1.5">
        <div v-for="col in columns" :key="col.letter" class="flex flex-col gap-0.5 sm:gap-1">
          <div
            class="rounded-md sm:rounded-lg py-1.5 sm:py-2 text-center text-xl sm:text-2xl font-black text-white tracking-wide"
            :style="{ background: col.color }"
          >
            {{ col.letter }}
          </div>
          <button
            v-for="num in getNumbers(col.start, col.end)"
            :key="num"
            class="cursor-pointer select-none rounded-md sm:rounded-lg border-2 py-1.5 sm:py-2 text-center text-sm sm:text-base font-semibold transition-all [-webkit-tap-highlight-color:transparent]"
            :class="
              calledNumbers.has(num)
                ? 'border-transparent text-white font-bold shadow-md hover:opacity-85 hover:scale-105'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:scale-105'
            "
            :style="calledNumbers.has(num) ? { background: col.color } : {}"
            @click="toggleNumber(num)"
          >
            {{ num }}
          </button>
        </div>
      </div>

      <HistoryPanel :history="history" />
    </div>
  </div>
</template>
