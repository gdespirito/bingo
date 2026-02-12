import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface Recording {
  blob: Blob
  url: string
  duration: number
}

export function useAudioRecorder() {
  const recordings = ref<Map<number, Recording>>(new Map())
  const currentNumber = ref(1)
  const status = ref<'idle' | 'recording' | 'exporting'>('idle')
  const exportProgress = ref(0)

  let mediaRecorder: MediaRecorder | null = null
  let recordingChunks: Blob[] = []
  let recordingStartTime = 0
  let stream: MediaStream | null = null

  const recordedCount = computed(() => recordings.value.size)

  async function startRecording() {
    if (status.value !== 'idle') return
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      recordingChunks = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunks.push(e.data)
      }
      mediaRecorder.onstop = () => {
        const duration = (Date.now() - recordingStartTime) / 1000
        const blob = new Blob(recordingChunks, { type: 'audio/webm;codecs=opus' })
        const url = URL.createObjectURL(blob)

        // Revoke old URL if re-recording
        const old = recordings.value.get(currentNumber.value)
        if (old) URL.revokeObjectURL(old.url)

        const updated = new Map(recordings.value)
        updated.set(currentNumber.value, { blob, url, duration })
        recordings.value = updated

        // Stop mic access
        stream?.getTracks().forEach((t) => t.stop())
        stream = null

        // Auto-advance to next unrecorded number
        autoAdvance()
      }
      recordingStartTime = Date.now()
      mediaRecorder.start()
      status.value = 'recording'
    } catch {
      status.value = 'idle'
    }
  }

  function stopRecording() {
    if (status.value !== 'recording' || !mediaRecorder) return
    mediaRecorder.stop()
    status.value = 'idle'
  }

  function toggleRecording() {
    if (status.value === 'recording') stopRecording()
    else if (status.value === 'idle') startRecording()
  }

  function autoAdvance() {
    // Find next number without recording, starting from current+1, wrapping around
    for (let offset = 1; offset <= 75; offset++) {
      const next = ((currentNumber.value - 1 + offset) % 75) + 1
      if (!recordings.value.has(next)) {
        currentNumber.value = next
        return
      }
    }
    // All recorded, stay on current
  }

  function goToNumber(n: number) {
    if (n >= 1 && n <= 75 && status.value !== 'recording') {
      currentNumber.value = n
    }
  }

  function playRecording(n: number) {
    const rec = recordings.value.get(n)
    if (rec) {
      const audio = new Audio(rec.url)
      audio.play()
    }
  }

  function deleteRecording(n: number) {
    const rec = recordings.value.get(n)
    if (rec) {
      URL.revokeObjectURL(rec.url)
      const updated = new Map(recordings.value)
      updated.delete(n)
      recordings.value = updated
    }
  }

  async function exportZip() {
    if (recordings.value.size === 0 || status.value === 'exporting') return
    status.value = 'exporting'
    exportProgress.value = 0

    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    const entries = Array.from(recordings.value.entries())
    for (let i = 0; i < entries.length; i++) {
      const [num, rec] = entries[i]!
      zip.file(`${num}.webm`, rec.blob)
      exportProgress.value = Math.round(((i + 1) / entries.length) * 80)
    }

    const content = await zip.generateAsync({ type: 'blob' }, (meta) => {
      exportProgress.value = 80 + Math.round((meta.percent / 100) * 20)
    })

    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bingo-audio.zip'
    a.click()
    URL.revokeObjectURL(url)

    exportProgress.value = 100
    status.value = 'idle'
  }

  // Spacebar listener
  function isInputFocused(): boolean {
    const tag = document.activeElement?.tagName?.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select'
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && !e.repeat && !isInputFocused()) {
      e.preventDefault()
      toggleRecording()
    }
  }

  // Beforeunload warning
  function onBeforeUnload(e: BeforeUnloadEvent) {
    if (recordings.value.size > 0) {
      e.preventDefault()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', onBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (mediaRecorder && status.value === 'recording') {
      mediaRecorder.stop()
    }
    stream?.getTracks().forEach((t) => t.stop())
  })

  return {
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
  }
}
