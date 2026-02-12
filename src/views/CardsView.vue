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
  return Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => (r === 2 && c === 2 ? null : null)),
  )
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

function cancelEditor() {
  showEditor.value = false
}

function confirmDelete(id: string) {
  if (confirm('Eliminar este carton?')) {
    removeCard(id)
  }
}

// ── Grid input handling ──
function onCellInput(row: number, col: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = parseInt(input.value)
  if (isNaN(val) || val < 1 || val > 75) {
    grid.value[row][col] = null
  } else {
    grid.value[row][col] = val
  }
}

function isFreeCell(row: number, col: number): boolean {
  return row === 2 && col === 2
}

// ── Card display helpers ──
function isCalled(num: number | null): boolean {
  if (num === null) return true
  return calledNumbers.value.has(num)
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

function colRange(colIdx: number): string {
  const c = columns[colIdx]
  return `${c.start}-${c.end}`
}

function colLetter(colIdx: number): string {
  return columns[colIdx].letter
}

// ── Photo → OCR with OpenAI Vision ──

function triggerFileUpload() {
  if (!apiKey.value.trim()) {
    showApiKeyInput.value = true
    return
  }
  fileInput.value?.click()
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  )
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
    if (isHeic(file)) {
      file = await convertHeicToJpeg(file)
    }
    const base64 = await fileToBase64(file)
    const parsed = await callVisionAPI(base64, file.type)
    applyParsedGrid(parsed)
  } catch (err: any) {
    photoError.value = err.message || 'Error al procesar la imagen'
  } finally {
    photoLoading.value = false
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip "data:image/...;base64," prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

async function callVisionAPI(base64: string, mimeType: string): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.value.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `This is a photo of a BINGO card. Extract the 5x5 grid of numbers exactly as they appear, row by row from top to bottom.

The columns are B (1-15), I (16-30), N (31-45), G (46-60), O (61-75).
The center cell (row 3, col 3) is always FREE — use 0 for it.

Return ONLY a JSON array of 5 arrays, each with 5 numbers. No explanation, no markdown, just the JSON.
Example: [[3,20,36,49,63],[13,16,33,54,70],[7,26,0,57,71],[15,21,42,47,75],[4,19,35,55,68]]`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
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

  // Parse JSON — handle possible markdown fences
  const jsonStr = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(jsonStr)

  // Validate structure
  if (!Array.isArray(parsed) || parsed.length !== 5) {
    throw new Error('La respuesta no tiene 5 filas')
  }
  for (const row of parsed) {
    if (!Array.isArray(row) || row.length !== 5) {
      throw new Error('Cada fila debe tener 5 numeros')
    }
  }

  return parsed as number[][]
}

function applyParsedGrid(parsed: number[][]) {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) {
        grid.value[r][c] = null // FREE
      } else {
        const val = parsed[r][c]
        grid.value[r][c] = val >= 1 && val <= 75 ? val : null
      }
    }
  }
  // Force reactivity
  grid.value = grid.value.map((row) => [...row])
}
</script>

<template>
  <div class="cards-page">
    <div class="cards-header">
      <h2>Mis Cartones</h2>
      <button class="add-btn" @click="openNewCard">+ Nuevo Carton</button>
    </div>

    <!-- Card list -->
    <div class="cards-grid" v-if="cards.length > 0 && !showEditor">
      <div
        v-for="card in cards"
        :key="card.id"
        class="card-item"
        :class="{ winner: checkCardWin(card) }"
      >
        <!-- Winner banner -->
        <div v-if="checkCardWin(card)" class="winner-banner">
          BINGO!
        </div>

        <div class="card-top">
          <span class="card-name">{{ card.name }}</span>
          <span class="card-progress">{{ cardCalledCount(card) }} / {{ getActivePattern().cells.length }}</span>
        </div>

        <!-- Mini bingo grid -->
        <div class="mini-board">
          <div class="mini-header-row">
            <div
              v-for="(col, ci) in columns"
              :key="ci"
              class="mini-header"
              :style="{ background: col.color }"
            >
              {{ col.letter }}
            </div>
          </div>
          <div v-for="(row, ri) in card.grid" :key="ri" class="mini-row">
            <div
              v-for="(cell, ci) in row"
              :key="ci"
              class="mini-cell"
              :class="{
                called: isCalled(cell) && isCellInPattern(ri, ci),
                free: isFreeCell(ri, ci),
                'in-pattern': isCellInPattern(ri, ci),
                'not-in-pattern': !isCellInPattern(ri, ci),
                'pattern-hit': isCalled(cell) && isCellInPattern(ri, ci),
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

        <div class="card-actions">
          <button class="action-btn edit" @click="openEditCard(card)">Editar</button>
          <button class="action-btn delete" @click="confirmDelete(card.id)">Eliminar</button>
        </div>
      </div>
    </div>

    <div class="empty-state" v-if="cards.length === 0 && !showEditor">
      <p>No tienes cartones guardados.</p>
      <p>Agrega uno para seguir tus numeros.</p>
    </div>

    <!-- API Key modal -->
    <div class="overlay" v-if="showApiKeyInput" @click.self="showApiKeyInput = false">
      <div class="api-modal">
        <h3>OpenAI API Key</h3>
        <p class="api-hint">Se necesita para leer fotos de cartones. Se guarda solo en tu navegador.</p>
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-..."
          class="name-input"
          @keyup.enter="saveApiKey"
        />
        <div class="api-modal-actions">
          <button class="save-btn" @click="saveApiKey">Guardar</button>
          <button class="cancel-btn" @click="showApiKeyInput = false">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Editor -->
    <div class="editor" v-if="showEditor">
      <div class="editor-card">
        <h3>{{ editingCardId ? 'Editar Carton' : 'Nuevo Carton' }}</h3>

        <div class="name-field">
          <label>Nombre</label>
          <input
            v-model="cardName"
            type="text"
            placeholder="Ej: Carton #442"
            class="name-input"
          />
        </div>

        <!-- Photo upload -->
        <div class="photo-section">
          <input
            ref="fileInput"
            type="file"
            accept="image/*,.heic,.heif"
            capture="environment"
            class="hidden-file"
            @change="onFileSelected"
          />
          <button
            class="photo-btn"
            :disabled="photoLoading"
            @click="triggerFileUpload"
          >
            <template v-if="photoLoading">
              <span class="spinner"></span> Analizando foto...
            </template>
            <template v-else>
              &#128247; Cargar foto del carton
            </template>
          </button>
          <button class="apikey-btn" @click="showApiKeyInput = true" title="Configurar API Key">
            &#9881;
          </button>
        </div>
        <p v-if="photoError" class="photo-error">{{ photoError }}</p>

        <p class="editor-hint">O ingresa los numeros manualmente, fila por fila.</p>

        <div class="edit-board">
          <div class="edit-header-row">
            <div
              v-for="(col, ci) in columns"
              :key="ci"
              class="edit-header"
              :style="{ background: col.color }"
            >
              {{ col.letter }}
              <span class="range-hint">{{ colRange(ci) }}</span>
            </div>
          </div>
          <div v-for="(row, ri) in grid" :key="ri" class="edit-row">
            <div v-for="(_, ci) in row" :key="ci" class="edit-cell-wrap">
              <div v-if="isFreeCell(ri, ci)" class="edit-cell free-cell">FREE</div>
              <input
                v-else
                type="number"
                :min="columns[ci].start"
                :max="columns[ci].end"
                :placeholder="colLetter(ci)"
                :value="grid[ri][ci] ?? ''"
                class="edit-cell"
                @input="onCellInput(ri, ci, $event)"
              />
            </div>
          </div>
        </div>

        <div class="editor-actions">
          <button class="save-btn" @click="saveCard">Guardar</button>
          <button class="cancel-btn" @click="cancelEditor">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cards-page {
  max-width: 700px;
  margin: 0 auto;
}

.cards-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.cards-header h2 {
  font-size: 1.3rem;
  font-weight: 800;
  color: #e2e8f0;
}
.add-btn {
  background: #2563eb;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.add-btn:hover {
  background: #1d4ed8;
}

/* ── Card grid ── */
.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-item {
  background: #1e293b;
  border: 2px solid #334155;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s;
}
.card-item.winner {
  border-color: #22c55e;
  box-shadow: 0 0 24px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1);
  animation: winPulse 2s ease infinite;
}
@keyframes winPulse {
  0%, 100% { box-shadow: 0 0 24px rgba(34, 197, 94, 0.25), 0 0 0 1px rgba(34, 197, 94, 0.1); }
  50% { box-shadow: 0 0 32px rgba(34, 197, 94, 0.4), 0 0 0 2px rgba(34, 197, 94, 0.2); }
}
.winner-banner {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  color: #22c55e;
  padding: 6px 0 10px;
  animation: bannerPop 0.4s ease;
}
@keyframes bannerPop {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-name {
  font-weight: 700;
  font-size: 1rem;
  color: #f1f5f9;
}
.card-progress {
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  background: #0f172a;
  padding: 4px 10px;
  border-radius: 8px;
}

/* ── Mini board ── */
.mini-board {
  margin-bottom: 12px;
}
.mini-header-row,
.mini-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
}
.mini-header-row {
  margin-bottom: 4px;
}
.mini-header {
  text-align: center;
  font-weight: 900;
  font-size: 0.85rem;
  padding: 4px 0;
  border-radius: 6px;
  color: white;
}
.mini-row {
  margin-bottom: 4px;
}
.mini-cell {
  text-align: center;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 8px 0;
  border-radius: 8px;
  background: #0f172a;
  border: 2px solid #334155;
  color: #64748b;
  transition: all 0.2s;
}
.mini-cell.called {
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
.mini-cell.not-in-pattern {
  opacity: 0.3;
}
.mini-cell.in-pattern {
  outline: 1px dashed rgba(148, 163, 184, 0.25);
  outline-offset: -1px;
}
.mini-cell.pattern-hit {
  outline: none;
}
.mini-cell.free {
  font-size: 0.65rem;
  font-weight: 800;
  color: white;
  letter-spacing: 0.05em;
}

.card-actions {
  display: flex;
  gap: 8px;
}
.action-btn {
  flex: 1;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  border: 2px solid transparent;
}
.action-btn.edit {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
.action-btn.edit:hover {
  border-color: #2563eb;
  color: #60a5fa;
}
.action-btn.delete {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}
.action-btn.delete:hover {
  border-color: #dc2626;
  color: #f87171;
}

/* ── Empty state ── */
.empty-state {
  text-align: center;
  padding: 48px 20px;
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* ── Editor ── */
.editor {
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.editor-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 20px;
}
.editor-card h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.name-field {
  margin-bottom: 16px;
}
.name-field label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 6px;
}
.name-input {
  width: 100%;
  background: #0f172a;
  border: 2px solid #334155;
  color: #f1f5f9;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;
}
.name-input:focus {
  border-color: #2563eb;
}

.editor-hint {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 12px;
}

/* ── Edit board (input grid) ── */
.edit-board {
  margin-bottom: 20px;
}
.edit-header-row,
.edit-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.edit-header-row {
  margin-bottom: 6px;
}
.edit-header {
  text-align: center;
  font-weight: 900;
  font-size: 0.9rem;
  padding: 6px 0 2px;
  border-radius: 8px;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.range-hint {
  font-size: 0.6rem;
  font-weight: 600;
  opacity: 0.7;
}
.edit-row {
  margin-bottom: 6px;
}
.edit-cell-wrap {
  display: flex;
}
.edit-cell {
  width: 100%;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 10px 0;
  border-radius: 8px;
  background: #0f172a;
  border: 2px solid #334155;
  color: #f1f5f9;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
  -moz-appearance: textfield;
}
.edit-cell::-webkit-outer-spin-button,
.edit-cell::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.edit-cell:focus {
  border-color: #2563eb;
}
.edit-cell::placeholder {
  color: #334155;
  font-weight: 600;
}
.free-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #475569;
  border-color: #475569;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: default;
}

.editor-actions {
  display: flex;
  gap: 10px;
}
.save-btn {
  flex: 1;
  background: #2563eb;
  border: none;
  color: white;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}
.save-btn:hover {
  background: #1d4ed8;
}
.cancel-btn {
  flex: 1;
  background: #0f172a;
  border: 2px solid #334155;
  color: #94a3b8;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.cancel-btn:hover {
  border-color: #64748b;
  color: #e2e8f0;
}

/* ── Photo upload ── */
.photo-section {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.hidden-file {
  display: none;
}
.photo-btn {
  flex: 1;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  border: none;
  color: white;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.photo-btn:hover:not(:disabled) {
  opacity: 0.9;
}
.photo-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
.apikey-btn {
  background: #0f172a;
  border: 2px solid #334155;
  color: #64748b;
  width: 44px;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.apikey-btn:hover {
  border-color: #64748b;
  color: #94a3b8;
}
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.photo-error {
  font-size: 0.8rem;
  color: #f87171;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(220, 38, 38, 0.2);
}

/* ── API Key modal ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}
.api-modal {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
}
.api-modal h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #e2e8f0;
  margin-bottom: 8px;
}
.api-hint {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 14px;
  line-height: 1.4;
}
.api-modal .name-input {
  margin-bottom: 14px;
}
.api-modal-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 420px) {
  .edit-cell {
    font-size: 0.9rem;
    padding: 8px 0;
  }
  .mini-cell {
    font-size: 0.8rem;
    padding: 6px 0;
  }
}
</style>
