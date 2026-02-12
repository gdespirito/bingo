<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBingoState } from '@/composables/useBingoState'

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

// ── Speech Recognition ──
const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

const listening = ref(false)
const speechText = ref('')
const speechStatus = ref<'idle' | 'listening' | 'success' | 'error'>('idle')
const recognizedNum = ref<number | null>(null)
let recognition: any = null

const wordToNumber: Record<string, number> = {
  uno: 1, una: 1, un: 1, one: 1,
  dos: 2, two: 2,
  tres: 3, three: 3,
  cuatro: 4, four: 4,
  cinco: 5, five: 5,
  seis: 6, six: 6,
  siete: 7, seven: 7,
  ocho: 8, eight: 8,
  nueve: 9, nine: 9,
  diez: 10, ten: 10,
  once: 11, eleven: 11,
  doce: 12, twelve: 12,
  trece: 13, thirteen: 13,
  catorce: 14, fourteen: 14,
  quince: 15, fifteen: 15,
  dieciséis: 16, dieciseis: 16, sixteen: 16,
  diecisiete: 17, seventeen: 17,
  dieciocho: 18, eighteen: 18,
  diecinueve: 19, nineteen: 19,
  veinte: 20, twenty: 20,
  veintiuno: 21, veintiún: 21, twentyone: 21,
  veintidós: 22, veintidos: 22, twentytwo: 22,
  veintitrés: 23, veintitres: 23, twentythree: 23,
  veinticuatro: 24, twentyfour: 24,
  veinticinco: 25, twentyfive: 25,
  veintiséis: 26, veintiseis: 26, twentysix: 26,
  veintisiete: 27, twentyseven: 27,
  veintiocho: 28, twentyeight: 28,
  veintinueve: 29, twentynine: 29,
  treinta: 30, thirty: 30,
  cuarenta: 40, forty: 40,
  cincuenta: 50, fifty: 50,
  sesenta: 60, sixty: 60,
  setenta: 70, seventy: 70,
}

function parseSpokenNumber(text: string): number | null {
  const clean = text.toLowerCase().trim()
  const digitMatch = clean.match(/(\d+)/)
  if (digitMatch) {
    const n = parseInt(digitMatch[1])
    if (n >= 1 && n <= 75) return n
  }
  if (wordToNumber[clean] !== undefined) return wordToNumber[clean]
  const compoundMatch = clean.match(/^(\w+)\s+y\s+(\w+)$/)
  if (compoundMatch) {
    const tens = wordToNumber[compoundMatch[1]]
    const ones = wordToNumber[compoundMatch[2]]
    if (tens && ones && tens >= 30 && tens <= 70 && ones >= 1 && ones <= 9) {
      const n = tens + ones
      if (n >= 1 && n <= 75) return n
    }
  }
  const words = clean.split(/\s+/)
  for (let i = words.length - 1; i >= 0; i--) {
    if (wordToNumber[words[i]] !== undefined) {
      if (i >= 2 && words[i - 1] === 'y' && wordToNumber[words[i - 2]] !== undefined) {
        const tens = wordToNumber[words[i - 2]]
        const ones = wordToNumber[words[i]]
        if (tens >= 30 && tens <= 70 && ones >= 1 && ones <= 9) {
          const n = tens + ones
          if (n >= 1 && n <= 75) return n
        }
      }
      const n = wordToNumber[words[i]]
      if (n >= 1 && n <= 75) return n
    }
  }
  return null
}

function startListening() {
  if (!SpeechRecognition || listening.value) return
  recognition = new SpeechRecognition()
  recognition.lang = 'es-CL'
  recognition.interimResults = false
  recognition.maxAlternatives = 3
  recognition.continuous = false
  recognition.onstart = () => {
    listening.value = true
    speechStatus.value = 'listening'
    speechText.value = ''
    recognizedNum.value = null
  }
  recognition.onresult = (event: any) => {
    let bestNum: number | null = null
    for (let i = 0; i < event.results[0].length; i++) {
      const transcript = event.results[0][i].transcript
      speechText.value = transcript
      const num = parseSpokenNumber(transcript)
      if (num !== null) { bestNum = num; break }
    }
    if (bestNum !== null) {
      recognizedNum.value = bestNum
      speechStatus.value = 'success'
      if (!calledNumbers.value.has(bestNum)) toggleNumber(bestNum)
    } else {
      speechStatus.value = 'error'
    }
    setTimeout(() => { if (!listening.value) speechStatus.value = 'idle' }, 2000)
  }
  recognition.onerror = () => {
    speechStatus.value = 'error'
    speechText.value = 'No se pudo reconocer'
    listening.value = false
    setTimeout(() => { speechStatus.value = 'idle' }, 2000)
  }
  recognition.onend = () => { listening.value = false }
  recognition.start()
}

function stopListening() { if (recognition) recognition.stop() }

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
    e.preventDefault()
    if (listening.value) stopListening()
    else startListening()
  }
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

onMounted(() => { window.addEventListener('keydown', onKeyDown) })
onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (recognition) recognition.abort()
})
</script>

<template>
  <div class="mx-auto max-w-[700px]">
    <!-- Stats -->
    <div class="mb-5 flex flex-wrap items-center justify-center gap-4">
      <div class="flex flex-col items-center gap-1">
        <span class="text-[0.7rem] font-semibold uppercase tracking-wider text-slate-500">Ultimo</span>
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
        <span>Presiona <kbd class="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-500">espacio</kbd> para dictar un numero</span>
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

      <!-- History panel -->
      <div class="w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 p-3 sm:w-[130px] sm:shrink-0 sm:max-h-[70vh]">
        <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          Historial <span class="text-slate-600">({{ history.length }})</span>
        </h3>
        <div v-if="history.length > 0" class="flex flex-row flex-wrap gap-1 sm:flex-col">
          <div
            v-for="(num, idx) in [...history].reverse()"
            :key="idx"
            class="flex items-center gap-1.5"
            :class="idx === 0 && 'animate-[pop-in_0.3s_ease]'"
          >
            <span class="hidden min-w-[18px] text-right text-[0.65rem] font-semibold text-slate-700 sm:inline">{{ history.length - idx }}</span>
            <span
              class="flex-1 rounded-md px-2 py-0.5 text-center text-xs font-bold text-white"
              :style="{ background: getColorForNumber(num) }"
            >
              {{ getLetterForNumber(num) }}-{{ num }}
            </span>
          </div>
        </div>
        <div v-else class="py-3 text-center text-xs text-slate-700">Sin numeros aun</div>
      </div>
    </div>
  </div>
</template>
