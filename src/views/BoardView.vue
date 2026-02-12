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

  // Try direct number in string: "42", "B 15", "B-15", "be 15"
  const digitMatch = clean.match(/(\d+)/)
  if (digitMatch) {
    const n = parseInt(digitMatch[1])
    if (n >= 1 && n <= 75) return n
  }

  // Try exact word match
  if (wordToNumber[clean] !== undefined) {
    return wordToNumber[clean]
  }

  // Try compound: "treinta y cinco" → 35, "sesenta y ocho" → 68
  const compoundMatch = clean.match(/^(\w+)\s+y\s+(\w+)$/)
  if (compoundMatch) {
    const tens = wordToNumber[compoundMatch[1]]
    const ones = wordToNumber[compoundMatch[2]]
    if (tens && ones && tens >= 30 && tens <= 70 && ones >= 1 && ones <= 9) {
      const n = tens + ones
      if (n >= 1 && n <= 75) return n
    }
  }

  // Try last word if multi-word (e.g. "la be quince" → quince → 15)
  const words = clean.split(/\s+/)
  for (let i = words.length - 1; i >= 0; i--) {
    if (wordToNumber[words[i]] !== undefined) {
      // Check for compound with previous word
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
    // Check all alternatives
    for (let i = 0; i < event.results[0].length; i++) {
      const transcript = event.results[0][i].transcript
      speechText.value = transcript
      const num = parseSpokenNumber(transcript)
      if (num !== null) {
        bestNum = num
        break
      }
    }

    if (bestNum !== null) {
      recognizedNum.value = bestNum
      speechStatus.value = 'success'
      // Only mark if not already called
      if (!calledNumbers.value.has(bestNum)) {
        toggleNumber(bestNum)
      }
    } else {
      speechStatus.value = 'error'
    }

    // Auto-clear status after a moment
    setTimeout(() => {
      if (!listening.value) {
        speechStatus.value = 'idle'
      }
    }, 2000)
  }

  recognition.onerror = () => {
    speechStatus.value = 'error'
    speechText.value = 'No se pudo reconocer'
    listening.value = false
    setTimeout(() => { speechStatus.value = 'idle' }, 2000)
  }

  recognition.onend = () => {
    listening.value = false
  }

  recognition.start()
}

function stopListening() {
  if (recognition) {
    recognition.stop()
  }
}

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
    e.preventDefault()
    if (listening.value) {
      stopListening()
    } else {
      startListening()
    }
  }
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  if (recognition) recognition.abort()
})
</script>

<template>
  <div class="board-page">
    <div class="stats">
      <div class="last-called" v-if="lastCalled">
        <span class="label">Ultimo</span>
        <span class="big-number" :style="{ background: getColorForNumber(lastCalled) }">
          {{ getLetterForNumber(lastCalled) }}-{{ lastCalled }}
        </span>
      </div>
      <div class="last-called" v-else>
        <span class="label">Ultimo</span>
        <span class="big-number empty">--</span>
      </div>
      <div class="counter">
        <span class="label">Llamados</span>
        <span class="count">{{ totalCalled }} / 75</span>
      </div>
      <button class="reset-btn" @click="resetBoard">Reiniciar</button>
    </div>

    <!-- Mic indicator -->
    <div class="mic-bar" :class="speechStatus">
      <div v-if="speechStatus === 'listening'" class="mic-content">
        <span class="mic-icon pulse">&#127908;</span>
        <span>Escuchando...</span>
      </div>
      <div v-else-if="speechStatus === 'success'" class="mic-content">
        <span class="mic-icon">&#9989;</span>
        <span>"{{ speechText }}" &rarr; <strong>{{ recognizedNum }}</strong></span>
      </div>
      <div v-else-if="speechStatus === 'error'" class="mic-content">
        <span class="mic-icon">&#10060;</span>
        <span>{{ speechText || 'No reconocido' }} &mdash; intenta de nuevo</span>
      </div>
      <div v-else class="mic-content mic-hint">
        <span class="mic-icon">&#127908;</span>
        <span>Presiona <kbd>espacio</kbd> para dictar un numero</span>
      </div>
    </div>

    <div class="main-layout">
      <div class="board">
        <div v-for="col in columns" :key="col.letter" class="column">
          <div class="column-header" :style="{ background: col.color }">
            {{ col.letter }}
          </div>
          <button
            v-for="num in getNumbers(col.start, col.end)"
            :key="num"
            class="cell"
            :class="{ called: calledNumbers.has(num) }"
            :style="calledNumbers.has(num) ? { background: col.color, borderColor: col.color } : {}"
            @click="toggleNumber(num)"
          >
            {{ num }}
          </button>
        </div>
      </div>

      <div class="history-panel">
        <h3>Historial <span class="history-count">({{ history.length }})</span></h3>
        <div class="history-list" v-if="history.length > 0">
          <div
            v-for="(num, idx) in [...history].reverse()"
            :key="idx"
            class="history-row"
            :class="{ latest: idx === 0 }"
          >
            <span class="history-index">{{ history.length - idx }}</span>
            <span class="history-chip" :style="{ background: getColorForNumber(num) }">
              {{ getLetterForNumber(num) }}-{{ num }}
            </span>
          </div>
        </div>
        <div class="history-empty" v-else>Sin numeros aun</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.board-page {
  max-width: 700px;
  margin: 0 auto;
}

.stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.last-called {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #94a3b8;
  font-weight: 600;
}

.big-number {
  font-size: 1.4rem;
  font-weight: 900;
  padding: 6px 16px;
  border-radius: 10px;
  color: white;
  min-width: 80px;
  text-align: center;
  animation: popIn 0.3s ease;
}
.big-number.empty {
  background: #1e293b;
  color: #475569;
}
@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.count {
  font-size: 1.2rem;
  font-weight: 700;
  color: #e2e8f0;
}

.reset-btn {
  background: #1e293b;
  border: 2px solid #334155;
  color: #94a3b8;
  padding: 8px 18px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.reset-btn:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
}

.main-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.board {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.column-header {
  font-size: 1.5rem;
  font-weight: 900;
  text-align: center;
  padding: 8px 0;
  border-radius: 10px;
  color: white;
  letter-spacing: 0.05em;
}

.cell {
  background: #1e293b;
  border: 2px solid #334155;
  color: #cbd5e1;
  font-size: 1rem;
  font-weight: 600;
  padding: 8px 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.cell:hover {
  border-color: #64748b;
  background: #283548;
  transform: scale(1.05);
}
.cell.called {
  color: white;
  font-weight: 700;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
.cell.called:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

/* History panel */
.history-panel {
  width: 130px;
  flex-shrink: 0;
  background: #1e293b;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #334155;
  max-height: 70vh;
  overflow-y: auto;
}
.history-panel h3 {
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.history-count {
  color: #64748b;
  font-weight: 600;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.history-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.history-row.latest {
  animation: popIn 0.3s ease;
}
.history-index {
  font-size: 0.65rem;
  color: #475569;
  font-weight: 600;
  min-width: 18px;
  text-align: right;
}
.history-chip {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  color: white;
  flex: 1;
  text-align: center;
}
.history-empty {
  font-size: 0.75rem;
  color: #475569;
  text-align: center;
  padding: 12px 0;
}

/* Mic bar */
.mic-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  padding: 8px 16px;
  border-radius: 10px;
  background: #1e293b;
  border: 2px solid #334155;
  transition: all 0.2s;
  min-height: 42px;
}
.mic-bar.listening {
  background: #1e3a2f;
  border-color: #22c55e;
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.15);
}
.mic-bar.success {
  background: #1e293b;
  border-color: #2563eb;
}
.mic-bar.error {
  background: #2d1f1f;
  border-color: #dc2626;
}
.mic-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
}
.mic-content.mic-hint {
  color: #64748b;
}
.mic-content kbd {
  background: #334155;
  color: #94a3b8;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 0.75rem;
  font-family: inherit;
  font-weight: 700;
  border: 1px solid #475569;
}
.mic-icon {
  font-size: 1.1rem;
}
.mic-icon.pulse {
  animation: pulseMic 1s ease infinite;
}
@keyframes pulseMic {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

@media (max-width: 520px) {
  .main-layout {
    flex-direction: column;
  }
  .history-panel {
    width: 100%;
    max-height: none;
  }
  .history-list {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .history-row {
    gap: 3px;
  }
  .history-index {
    display: none;
  }
  .column-header {
    font-size: 1.2rem;
    padding: 6px 0;
  }
  .cell {
    font-size: 0.85rem;
    padding: 6px 0;
  }
}
</style>
