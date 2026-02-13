import { ref, onMounted, onUnmounted } from 'vue'

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
  if (digitMatch?.[1]) {
    const n = parseInt(digitMatch[1])
    if (n >= 1 && n <= 75) return n
  }
  if (wordToNumber[clean] !== undefined) return wordToNumber[clean]
  const compoundMatch = clean.match(/^(\w+)\s+y\s+(\w+)$/)
  if (compoundMatch?.[1] && compoundMatch[2]) {
    const tens = wordToNumber[compoundMatch[1]]
    const ones = wordToNumber[compoundMatch[2]]
    if (tens && ones && tens >= 30 && tens <= 70 && ones >= 1 && ones <= 9) {
      const n = tens + ones
      if (n >= 1 && n <= 75) return n
    }
  }
  const words = clean.split(/\s+/)
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i]!
    if (wordToNumber[word] !== undefined) {
      if (i >= 2 && words[i - 1] === 'y' && wordToNumber[words[i - 2]!] !== undefined) {
        const tens = wordToNumber[words[i - 2]!]!
        const ones = wordToNumber[word]!
        if (tens >= 30 && tens <= 70 && ones >= 1 && ones <= 9) {
          const n = tens + ones
          if (n >= 1 && n <= 75) return n
        }
      }
      const n = wordToNumber[word]!
      if (n >= 1 && n <= 75) return n
    }
  }
  return null
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export function useSpeechRecognition(onNumber: (num: number) => void) {
  const listening = ref(false)
  const speechText = ref('')
  const speechStatus = ref<'idle' | 'listening' | 'success' | 'error'>('idle')
  const recognizedNum = ref<number | null>(null)
  let recognition: any = null

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
    let handled = false
    recognition.onresult = (event: any) => {
      if (handled) return
      // Only process once the result is final
      const result = event.results[event.results.length - 1]
      if (!result.isFinal) return
      handled = true

      let bestNum: number | null = null
      for (let i = 0; i < result.length; i++) {
        const transcript = result[i].transcript
        speechText.value = transcript
        const num = parseSpokenNumber(transcript)
        if (num !== null) { bestNum = num; break }
      }
      if (bestNum !== null) {
        recognizedNum.value = bestNum
        speechStatus.value = 'success'
        onNumber(bestNum)
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
    recognition.onend = () => {
      listening.value = false
      if (speechStatus.value === 'listening') {
        speechStatus.value = 'error'
        speechText.value = 'No se detectó voz'
        setTimeout(() => { speechStatus.value = 'idle' }, 2000)
      }
    }
    recognition.start()
  }

  function stopListening() {
    if (recognition) {
      recognition.abort()
      listening.value = false
      speechStatus.value = 'idle'
    }
  }

  function isInputFocused(): boolean {
    const tag = document.activeElement?.tagName?.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select'
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
      e.preventDefault()
      if (listening.value) stopListening()
      else startListening()
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space' && !isInputFocused()) {
      e.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    if (recognition) recognition.abort()
  })

  return { listening, speechText, speechStatus, recognizedNum, startListening, stopListening }
}
