import { ref, watch } from 'vue'

interface Speaker {
  id: string
  name: string
  baseUrl: string
}

const SOUND_KEY = 'bingo-sound-enabled'
const SPEAKER_KEY = 'bingo-speaker'

const speakers: Speaker[] = [
  { id: 'gonza', name: 'Gonza', baseUrl: 'https://storage.freshwork.dev/bingo/gonza' },
]

const soundEnabled = ref<boolean>(localStorage.getItem(SOUND_KEY) === 'true')
const selectedSpeakerId = ref<string>(localStorage.getItem(SPEAKER_KEY) ?? speakers[0]!.id)
const preloadProgress = ref(0)
const isPreloading = ref(false)

const audioCache = new Map<string, HTMLAudioElement>()

watch(soundEnabled, (v) => localStorage.setItem(SOUND_KEY, String(v)))
watch(selectedSpeakerId, (v) => localStorage.setItem(SPEAKER_KEY, v))

function getAudioUrl(speakerId: string, num: number): string {
  const speaker = speakers.find((s) => s.id === speakerId)
  return `${speaker?.baseUrl ?? speakers[0]!.baseUrl}/${num}.webm`
}

function loadAudio(speakerId: string, num: number): Promise<HTMLAudioElement> {
  const key = `${speakerId}:${num}`
  const cached = audioCache.get(key)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    const audio = new Audio(getAudioUrl(speakerId, num))
    audio.preload = 'auto'
    audio.addEventListener('canplaythrough', () => {
      audioCache.set(key, audio)
      resolve(audio)
    }, { once: true })
    audio.addEventListener('error', () => {
      // Still cache to avoid retrying broken URLs
      audioCache.set(key, audio)
      resolve(audio)
    }, { once: true })
    audio.load()
  })
}

async function preloadAll() {
  if (isPreloading.value) return
  isPreloading.value = true
  preloadProgress.value = 0
  const id = selectedSpeakerId.value

  const batch = 10
  for (let start = 1; start <= 75; start += batch) {
    const end = Math.min(start + batch - 1, 75)
    const promises: Promise<HTMLAudioElement>[] = []
    for (let n = start; n <= end; n++) promises.push(loadAudio(id, n))
    await Promise.all(promises)
    preloadProgress.value = end
    // Bail if speaker changed mid-preload
    if (selectedSpeakerId.value !== id) break
  }

  isPreloading.value = false
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  if (soundEnabled.value) preloadAll()
}

function setSpeaker(id: string) {
  selectedSpeakerId.value = id
  if (soundEnabled.value) preloadAll()
}

async function playNumber(num: number) {
  if (!soundEnabled.value) return
  const id = selectedSpeakerId.value
  const audio = await loadAudio(id, num)
  audio.currentTime = 0
  audio.play().catch(() => {})
}

// Auto-preload on first use if enabled
if (soundEnabled.value) preloadAll()

export function useBingoAudio() {
  return {
    soundEnabled,
    selectedSpeakerId,
    speakers,
    preloadProgress,
    isPreloading,
    toggleSound,
    setSpeaker,
    playNumber,
  }
}
