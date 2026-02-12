<script setup lang="ts">
import { ref } from 'vue'
import { useBingoState } from '@/composables/useBingoState'
import { useBingoAudio } from '@/composables/useBingoAudio'
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

const {
  soundEnabled,
  selectedSpeakerId,
  speakers,
  isPreloading,
  preloadProgress,
  toggleSound,
  setSpeaker,
  playNumber,
} = useBingoAudio()

function getNumbers(start: number, end: number): number[] {
  const nums: number[] = []
  for (let i = start; i <= end; i++) nums.push(i)
  return nums
}

const { speechStatus, speechText, recognizedNum } = useSpeechRecognition((num) => {
  if (!calledNumbers.value.has(num)) {
    toggleNumber(num)
    playNumber(num)
  }
})

// ── Board cell animation ──
const justToggled = ref<number | null>(null)
let toggleTimer: ReturnType<typeof setTimeout> | null = null

function onToggle(num: number) {
  const wasUncalled = !calledNumbers.value.has(num)
  toggleNumber(num)
  if (wasUncalled) playNumber(num)
  justToggled.value = num
  if (toggleTimer) clearTimeout(toggleTimer)
  toggleTimer = setTimeout(() => { justToggled.value = null }, 400)
}

// ── Random number generator ──
const randomResult = ref<number | null>(null)
const randomAnimating = ref(false)
const randomKey = ref(0)

function drawRandomNumber() {
  const available: number[] = []
  for (let i = 1; i <= 75; i++) {
    if (!calledNumbers.value.has(i)) available.push(i)
  }
  if (available.length === 0) return
  randomAnimating.value = true
  randomResult.value = null
  const chosen = available[Math.floor(Math.random() * available.length)]!
  setTimeout(() => {
    randomResult.value = chosen
    randomKey.value++
    toggleNumber(chosen)
    playNumber(chosen)
    randomAnimating.value = false
    setTimeout(() => { randomResult.value = null }, 1800)
  }, 300)
}
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
      <label class="flex cursor-pointer items-center gap-2" @click.prevent="toggleSound">
        <span class="text-sm font-semibold" :class="soundEnabled ? 'text-emerald-400' : 'text-slate-500'">🔊</span>
        <span
          class="relative inline-block h-6 w-10 rounded-full transition-colors"
          :class="soundEnabled ? 'bg-emerald-600' : 'bg-slate-700'"
        >
          <span
            class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
            :class="soundEnabled ? 'translate-x-4' : 'translate-x-0'"
          />
        </span>
      </label>
      <select
        v-if="soundEnabled"
        class="cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-400 transition-all hover:border-slate-700"
        :value="selectedSpeakerId"
        @change="setSpeaker(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="s in speakers" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <span v-if="isPreloading" class="text-xs text-slate-500">Cargando {{ preloadProgress }}/75</span>
    </div>

    <!-- Random draw -->
    <div class="mb-4 flex justify-center">
      <button
        class="cursor-pointer rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-3 text-base font-extrabold text-white shadow-lg transition-all hover:scale-105 hover:shadow-orange-600/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="totalCalled >= 75 || randomAnimating"
        @click="drawRandomNumber"
      >
        <span v-if="randomAnimating" class="inline-flex items-center gap-2">
          <span class="inline-block h-4 w-4 animate-[spin_0.5s_linear_infinite] rounded-full border-2 border-white/30 border-t-white"></span>
          Sacando...
        </span>
        <span v-else>&#127922; Sacar número</span>
      </button>
    </div>

    <!-- Floating random result overlay -->
    <Teleport to="body">
      <div
        v-if="randomResult !== null"
        :key="randomKey"
        class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center animate-[float-reveal_1.8s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
      >
        <span
          class="rounded-2xl px-8 py-4 text-5xl font-black text-white sm:text-6xl"
          :style="{ background: getColorForNumber(randomResult), boxShadow: '0 0 60px ' + getColorForNumber(randomResult) + '80, 0 0 120px ' + getColorForNumber(randomResult) + '30' }"
        >
          {{ getLetterForNumber(randomResult) }}-{{ randomResult }}
        </span>
      </div>
    </Teleport>

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
            :class="[
              calledNumbers.has(num)
                ? 'border-transparent text-white font-bold shadow-md hover:opacity-85 hover:scale-105'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:scale-105',
              justToggled === num && calledNumbers.has(num) && 'animate-[mark-pop_0.25s_ease-out]',
              justToggled === num && !calledNumbers.has(num) && 'animate-[unmark-shrink_0.2s_ease]',
            ]"
            :style="calledNumbers.has(num) ? { background: col.color } : {}"
            @click="onToggle(num)"
          >
            {{ num }}
          </button>
        </div>
      </div>

      <HistoryPanel :history="history" />
    </div>
  </div>
</template>
