<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useBingoState } from '@/composables/useBingoState'

const route = useRoute()
const { activeGameMode, gameModes, setGameMode } = useBingoState()
</script>

<template>
  <div class="app">
    <header>
      <h1>
        <router-link to="/" class="logo-link">BINGO</router-link>
      </h1>
      <nav>
        <router-link to="/" class="nav-link" :class="{ active: route.name === 'board' }">
          Tablero
        </router-link>
        <router-link to="/cartones" class="nav-link" :class="{ active: route.name === 'cards' }">
          Mis Cartones
        </router-link>
      </nav>

      <div class="game-mode-selector">
        <span class="mode-label">Modo de juego</span>
        <div class="mode-pills">
          <button
            v-for="mode in gameModes"
            :key="mode.id"
            class="mode-pill"
            :class="{ active: activeGameMode === mode.id }"
            @click="setGameMode(mode.id)"
          >
            <span class="mode-icon">{{ mode.icon }}</span>
            <span class="mode-name">{{ mode.label }}</span>
          </button>
        </div>
      </div>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: #0f172a;
  color: #f1f5f9;
  min-height: 100vh;
}

.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

header {
  text-align: center;
  margin-bottom: 24px;
}

header h1 {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 0.3em;
  margin-bottom: 12px;
}

.logo-link {
  background: linear-gradient(135deg, #e74c3c, #f39c12, #2ecc71, #3498db, #9b59b6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-decoration: none;
}

nav {
  display: flex;
  justify-content: center;
  gap: 6px;
  background: #1e293b;
  border-radius: 12px;
  padding: 4px;
  display: inline-flex;
}

.nav-link {
  padding: 8px 20px;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
}
.nav-link:hover {
  color: #e2e8f0;
}
.nav-link.active {
  background: #334155;
  color: #f1f5f9;
}

/* Game mode selector */
.game-mode-selector {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.mode-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 600;
}
.mode-pills {
  display: inline-flex;
  gap: 4px;
  background: #1e293b;
  border-radius: 12px;
  padding: 4px;
}
.mode-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.mode-pill:hover {
  color: #94a3b8;
}
.mode-pill.active {
  background: #334155;
  color: #f1f5f9;
}
.mode-icon {
  font-size: 0.9rem;
}
.mode-name {
  font-size: 0.8rem;
}

@media (max-width: 420px) {
  .app {
    padding: 10px;
  }
  header h1 {
    font-size: 2rem;
  }
  .nav-link {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
  .mode-pill {
    padding: 5px 8px;
  }
  .mode-name {
    font-size: 0.7rem;
  }
}
</style>
