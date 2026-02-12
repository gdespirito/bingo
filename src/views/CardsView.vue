<script setup lang="ts">
import { ref } from 'vue'
import heic2any from 'heic2any'
import { useBingoState, type BingoCard } from '@/composables/useBingoState'

const {
  calledNumbers,
  cards,
  addCard,
  removeCard,
  updateCard,
  columns,
  getColorForColumn,
  activeGameMode,
  getActivePattern,
  isCellInPattern,
  checkCardWin,
} = useBingoState()

// ── API Key ──
const APIKEY_STORAGE = 'bingo-openai-key'
const apiKey = ref(localStorage.getItem(APIKEY_STORAGE) ?? '')
const showApiKeyInput = ref(false)

function saveApiKey() {
  localStorage.setItem(APIKEY_STORAGE, apiKey.value.trim())
  showApiKeyInput.value = false
}

// ── Editor state ──
const showEditor = ref(false)
const editingCardId = ref<string | null>(null)
const cardName = ref('')
const grid = ref<(number | null)[][]>(emptyGrid())

// ── Photo upload state ──
const photoLoading = ref(false)
const photoError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

function emptyGrid(): (number | null)[][] {
  return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => null))
}

function openNewCard() {
  editingCardId.value = null
  cardName.value = ''
  grid.value = emptyGrid()
  photoError.value = ''
  showEditor.value = true
}

function openEditCard(card: BingoCard) {
  editingCardId.value = card.id
  cardName.value = card.name
  grid.value = card.grid.map((row) => [...row])
  photoError.value = ''
  showEditor.value = true
}

function saveCard() {
  if (editingCardId.value) {
    updateCard(editingCardId.value, cardName.value || 'Mi Carton', grid.value)
  } else {
    addCard(cardName.value || 'Mi Carton', grid.value)
  }
  showEditor.value = false
}

function cancelEditor() { showEditor.value = false }

function confirmDelete(id: string) {
  if (confirm('Eliminar este carton?')) removeCard(id)
}

function onCellInput(row: number, col: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = parseInt(input.value)
  grid.value[row][col] = isNaN(val) || val < 1 || val > 75 ? null : val
}

function isFreeCell(row: number, col: number): boolean { return row === 2 && col === 2 }

function isCalled(num: number | null): boolean {
  return num === null || calledNumbers.value.has(num)
}

function cardCalledCount(card: BingoCard): number {
  const pattern = getActivePattern()
  let count = 0
  for (const [r, c] of pattern.cells) {
    const cell = card.grid[r][c]
    if (cell === null || calledNumbers.value.has(cell)) count++
  }
  return count
}

function colRange(ci: number): string { return `${columns[ci].start}-${columns[ci].end}` }
function colLetter(ci: number): string { return columns[ci].letter }

// ── Photo → OCR ──

function triggerFileUpload() {
  if (!apiKey.value.trim()) { showApiKeyInput.value = true; return }
  fileInput.value?.click()
}

function isHeic(file: File): boolean {
  const n = file.name.toLowerCase()
  return file.type === 'image/heic' || file.type === 'image/heif' || n.endsWith('.heic') || n.endsWith('.heif')
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = (await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })) as Blob
  return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' })
}

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  let file = input.files?.[0]
  if (!file) return
  input.value = ''
  photoError.value = ''
  photoLoading.value = true
  try {
    if (isHeic(file)) file = await convertHeicToJpeg(file)
    const base64 = await fileToBase64(file)
    applyParsedGrid(await callVisionAPI(base64, file.type))
  } catch (err: any) {
    photoError.value = err.message || 'Error al procesar la imagen'
  } finally {
    photoLoading.value = false
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

async function callVisionAPI(base64: string, mimeType: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.value.trim()}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `This is a photo of a BINGO card. Extract the 5x5 grid of numbers exactly as they appear, row by row from top to bottom.\n\nThe columns are B (1-15), I (16-30), N (31-45), G (46-60), O (61-75).\nThe center cell (row 3, col 3) is always FREE — use 0 for it.\n\nReturn ONLY a JSON array of 5 arrays, each with 5 numbers. No explanation, no markdown, just the JSON.\nExample: [[3,20,36,49,63],[13,16,33,54,70],[7,26,0,57,71],[15,21,42,47,75],[4,19,35,55,68]]` },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 300,
      temperature: 0,
    }),
  })
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    throw new Error(errBody.error?.message || `API error: ${response.status}`)
  }
  const data = await response.json()
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Respuesta vacia de la API')
  const jsonStr = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed) || parsed.length !== 5) throw new Error('La respuesta no tiene 5 filas')
  for (const row of parsed) { if (!Array.isArray(row) || row.length !== 5) throw new Error('Cada fila debe tener 5 numeros') }
  return parsed as number[][]
}

function applyParsedGrid(parsed: number[][]) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) grid.value[r][c] = null
      else { const v = parsed[r][c]; grid.value[r][c] = v >= 1 && v <= 75 ? v : null }
    }
  }
  grid.value = grid.value.map((row) => [...row])
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
        + Nuevo Carton
      </button>
    </div>

    <!-- Card list -->
    <div v-if="cards.length > 0 && !showEditor" class="flex flex-col gap-5">
      <div
        v-for="card in cards"
        :key="card.id"
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
            {{ cardCalledCount(card) }} / {{ getActivePattern().cells.length }}
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
            @click="openEditCard(card)"
          >
            Editar
          </button>
          <button
            class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-900 py-2 text-sm font-semibold text-slate-500 transition-all hover:border-red-600 hover:text-red-400"
            @click="confirmDelete(card.id)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="cards.length === 0 && !showEditor" class="py-12 text-center text-slate-700 leading-relaxed">
      <p>No tienes cartones guardados.</p>
      <p>Agrega uno para seguir tus numeros.</p>
    </div>

    <!-- API Key modal -->
    <div
      v-if="showApiKeyInput"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
      @click.self="showApiKeyInput = false"
    >
      <div class="w-full max-w-[400px] rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 class="mb-2 text-lg font-extrabold text-slate-300">OpenAI API Key</h3>
        <p class="mb-3.5 text-sm leading-snug text-slate-600">Se necesita para leer fotos de cartones. Se guarda solo en tu navegador.</p>
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-..."
          class="mb-3.5 w-full rounded-lg border-2 border-slate-800 bg-slate-950 px-3.5 py-2.5 font-semibold text-slate-100 outline-none transition-colors focus:border-blue-600"
          @keyup.enter="saveApiKey"
        />
        <div class="flex gap-2.5">
          <button class="flex-1 cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700" @click="saveApiKey">Guardar</button>
          <button class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-950 py-3 font-semibold text-slate-500 transition-all hover:border-slate-700 hover:text-slate-300" @click="showApiKeyInput = false">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div v-if="showEditor" class="animate-[fade-in_0.2s_ease]">
      <div class="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h3 class="mb-4 text-lg font-extrabold text-slate-300">
          {{ editingCardId ? 'Editar Carton' : 'Nuevo Carton' }}
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
            @click="showApiKeyInput = true"
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
                :min="columns[ci].start"
                :max="columns[ci].end"
                :placeholder="colLetter(ci)"
                :value="grid[ri][ci] ?? ''"
                class="w-full rounded-lg border-2 border-slate-800 bg-slate-950 py-2.5 text-center text-lg font-bold text-slate-100 outline-none transition-colors placeholder:font-semibold placeholder:text-slate-800 focus:border-blue-600"
                @input="onCellInput(ri, ci, $event)"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2.5">
          <button class="flex-1 cursor-pointer rounded-lg bg-blue-600 py-3 font-bold text-white transition-colors hover:bg-blue-700" @click="saveCard">Guardar</button>
          <button class="flex-1 cursor-pointer rounded-lg border-2 border-slate-800 bg-slate-950 py-3 font-semibold text-slate-500 transition-all hover:border-slate-700 hover:text-slate-300" @click="cancelEditor">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>
