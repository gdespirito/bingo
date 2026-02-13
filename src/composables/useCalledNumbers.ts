import { ref, computed } from 'vue'

const STORAGE_KEY = 'bingo-state'

function loadCalledState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      return {
        history: data.history as number[],
        calledNumbers: new Set<number>(data.history),
        lastCalled:
          data.history.length > 0 ? data.history[data.history.length - 1] : null,
      }
    }
  } catch {
    /* ignore */
  }
  return { history: [] as number[], calledNumbers: new Set<number>(), lastCalled: null as number | null }
}

const saved = loadCalledState()
export const calledNumbers = ref<Set<number>>(saved.calledNumbers)
export const lastCalled = ref<number | null>(saved.lastCalled)
export const history = ref<number[]>(saved.history)
export const totalCalled = computed(() => calledNumbers.value.size)

function saveCalledState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ history: history.value }))
}

export function toggleNumber(num: number) {
  if (calledNumbers.value.has(num)) {
    calledNumbers.value.delete(num)
    history.value = history.value.filter((n) => n !== num)
    if (lastCalled.value === num) {
      lastCalled.value =
        history.value.length > 0 ? history.value[history.value.length - 1]! : null
    }
  } else {
    calledNumbers.value.add(num)
    history.value.push(num)
    lastCalled.value = num
  }
  calledNumbers.value = new Set(calledNumbers.value)
  saveCalledState()
}

export function resetBoard() {
  calledNumbers.value = new Set()
  lastCalled.value = null
  history.value = []
  localStorage.removeItem(STORAGE_KEY)
}
