<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  pieceSet: string;
  boardTheme: string;
}>();

const emit = defineEmits<{
  (e: "update:pieceSet", value: string): void;
  (e: "update:boardTheme", value: string): void;
}>();

const pieceSets = [
  "alpha",
  "anarcandy",
  "caliente",
  "california",
  "cardinal",
  "cburnett",
  "celtic",
  "chess7",
  "chessnut",
  "companion",
  "cooke",
  "dubrovny",
  "fantasy",
  "firi",
  "fresca",
  "gioco",
  "governor",
  "horsey",
  "icpieces",
  "kiwen-suwi",
  "kosal",
  "leipzig",
  "letter",
  "maestro",
  "merida",
  "monarchy",
  "mpchess",
  "pirouetti",
  "pixel",
  "reillycraig",
  "rhosgfx",
  "riohacha",
  "shahi-ivory-brown",
  "shapes",
  "spatial",
  "staunty",
  "tatiana",
];

const boardThemes = [
  { id: "blue", name: "Blue", ext: "png" },
  { id: "blue2", name: "Blue 2", ext: "jpg" },
  { id: "blue3", name: "Blue 3", ext: "jpg" },
  { id: "blue-marble", name: "Blue Marble", ext: "jpg" },
  { id: "brown", name: "Brown", ext: "png" },
  { id: "canvas2", name: "Canvas", ext: "jpg" },
  { id: "green", name: "Green", ext: "png" },
  { id: "green-plastic", name: "Green Plastic", ext: "png" },
  { id: "grey", name: "Grey", ext: "jpg" },
  { id: "leather", name: "Leather", ext: "jpg" },
  { id: "maple", name: "Maple", ext: "jpg" },
  { id: "maple2", name: "Maple 2", ext: "jpg" },
  { id: "marble", name: "Marble", ext: "jpg" },
  { id: "metal", name: "Metal", ext: "jpg" },
  { id: "olive", name: "Olive", ext: "jpg" },
  { id: "purple", name: "Purple", ext: "png" },
  { id: "wood", name: "Wood", ext: "jpg" },
  { id: "wood2", name: "Wood 2", ext: "jpg" },
  { id: "wood3", name: "Wood 3", ext: "jpg" },
  { id: "wood4", name: "Wood 4", ext: "jpg" },
];

const isOpen = ref(false);
const baseUrl = import.meta.env.BASE_URL;

const selectPieceSet = (set: string) => {
  emit("update:pieceSet", set);
};

const selectBoardTheme = (themeId: string) => {
  emit("update:boardTheme", themeId);
};
</script>

<template>
  <div class="appearance-settings">
    <button
      @click="isOpen = !isOpen"
      class="settings-trigger"
      :class="{ active: isOpen }"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        ></path>
      </svg>
      <span>Appearance</span>
    </button>

    <transition name="slide-fade">
      <div v-if="isOpen" class="settings-panel">
        <div class="settings-section">
          <label>Board Theme</label>
          <div class="themes-grid">
            <button
              v-for="theme in boardThemes"
              :key="theme.id"
              class="theme-thumb"
              :class="{ active: boardTheme === theme.id }"
              @click="selectBoardTheme(theme.id)"
              :title="theme.name"
            >
              <img
                :src="`${baseUrl}/board/${theme.id}.thumbnail.${theme.ext}`"
                :alt="theme.name"
              />
            </button>
          </div>
        </div>

        <div class="settings-section">
          <label>Piece Set</label>
          <div class="pieces-list">
            <button
              v-for="set in pieceSets"
              :key="set"
              class="piece-item"
              :class="{ active: pieceSet === set }"
              @click="selectPieceSet(set)"
            >
              <img
                :src="`${baseUrl}/pieces/${set}/wN.svg`"
                class="piece-preview"
                v-if="set !== 'monarchy' && set !== 'mono'"
              />
              <img
                :src="`${baseUrl}/pieces/${set}/wN.webp`"
                class="piece-preview"
                v-else-if="set === 'monarchy'"
              />
              <img :src="`${baseUrl}/pieces/${set}/N.svg`" class="piece-preview" v-else />
              <span>{{ set }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.appearance-settings {
  position: relative;
  width: 100%;
}

.settings-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #000;
  border: 1px solid var(--border-subtle);
  color: var(--text-dim);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  transition: all 0.2s;
}

.settings-trigger:hover {
  border-color: var(--text-dark);
  color: var(--text-main);
}

.settings-trigger.active {
  background: var(--bg-surface);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  box-shadow: 0 0 15px rgba(204, 255, 0, 0.1);
}

.settings-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--accent-primary);
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
}

.settings-section label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 800;
  color: var(--text-dark);
  font-family: var(--font-mono);
}

.theme-thumb {
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 2px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.theme-thumb.active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 10px rgba(204, 255, 0, 0.2);
}

.piece-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: pointer;
  color: var(--text-dim);
  text-transform: uppercase;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.05em;
}

.piece-item.active {
  background: rgba(204, 255, 0, 0.05);
  border-color: var(--accent-primary);
  color: var(--text-bright);
}

.settings-trigger:hover {
  border-color: var(--accent-primary);
}

.settings-trigger.active {
  background: var(--bg-deep);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.settings-panel {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 0.75rem;
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-section label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800;
  color: var(--text-dim);
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.theme-thumb {
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-deep);
}

.theme-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.theme-thumb.active {
  border-color: var(--accent-primary);
}

.pieces-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.piece-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-main);
  text-transform: capitalize;
  font-size: 0.85rem;
}

.piece-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.piece-item.active {
  background: rgba(204, 255, 0, 0.05);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  font-weight: 600;
}

.piece-preview {
  width: 24px;
  height: 24px;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}
</style>
