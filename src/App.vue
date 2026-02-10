<script setup lang="ts">
import { ref, computed, shallowRef, onMounted, watch, triggerRef } from "vue";
import { Chess } from "chess.js";
import ChessBoard from "./components/ChessBoard.vue";
import MoveTree from "./components/MoveTree.vue";
import StudyManager from "./components/StudyManager.vue";
import AppearanceSettings from "./components/AppearanceSettings.vue";
import {
  type Study,
  type MoveNode,
  parsePgnToTree,
  getPathToNode,
  findNextUnplayedLine,
  getLeafNodes,
  loadStudies,
  saveStudies,
  createStudy,
  updateStudy,
  deleteStudy,
} from "./lib/chess";

// App Mode
type AppMode = "edit" | "drill";
const mode = ref<AppMode>("edit");

// Player Color (which side the user plays)
type PlayerColor = "white" | "black";
const playerColor = ref<PlayerColor>("white");

// Board orientation
const boardOrientation = computed(() => playerColor.value);

// Studies
const studies = ref<Study[]>([]);
const currentStudy = ref<Study | null>(null);

// Tree state
const moveTree = shallowRef<MoveNode | null>(null);
const currentNode = ref<MoveNode | null>(null);
const completedLines = ref<Set<string>>(new Set());
const currentTargetLine = ref<MoveNode[]>([]);
const currentTargetIndex = ref(0);

// Chess game state
const game = shallowRef(new Chess());
const gameVersion = ref(0);

// Feedback
const feedback = ref<"correct" | "variation" | "wrong" | null>(null);
const feedbackTimer = ref<number | null>(null);
const lastMove = ref<string[]>([]);

// Drill progress
const totalLines = ref(0);
const completedCount = computed(() => completedLines.value.size);

// Appearance
const pieceSet = ref(localStorage.getItem("blitzdrill-pieceSet") || "cburnett");
const boardTheme = ref(
  localStorage.getItem("blitzdrill-boardTheme") || "brown",
);
const isSidebarCollapsed = ref(
  localStorage.getItem("blitzdrill-sidebarCollapsed") === "true",
);

watch(pieceSet, (val) => localStorage.setItem("blitzdrill-pieceSet", val));
watch(boardTheme, (val) => localStorage.setItem("blitzdrill-boardTheme", val));
watch(isSidebarCollapsed, (val) =>
  localStorage.setItem("blitzdrill-sidebarCollapsed", String(val)),
);

// Force reactivity
const updateGame = () => {
  gameVersion.value++;
  triggerRef(game);
};

// Computed board state
const fen = computed(() => {
  gameVersion.value;
  return game.value.fen();
});

const dests = computed(() => {
  gameVersion.value;
  const d = new Map<string, string[]>();

  if (mode.value === "drill" && !isPlayerTurn()) {
    return d;
  }

  game.value.moves({ verbose: true }).forEach((m) => {
    if (d.has(m.from)) {
      d.get(m.from)!.push(m.to);
    } else {
      d.set(m.from, [m.to]);
    }
  });
  return d;
});

const movableColor = computed(() => {
  gameVersion.value;
  if (mode.value === "edit") {
    return game.value.turn() === "w" ? "white" : "black";
  }
  const currentTurn = game.value.turn() === "w" ? "white" : "black";
  return currentTurn === playerColor.value ? playerColor.value : "none";
});

const currentNodeId = computed(() => currentNode.value?.id || "root");

onMounted(() => {
  studies.value = loadStudies();
});

watch(
  studies,
  (newStudies) => {
    saveStudies(newStudies);
  },
  { deep: true },
);

const handleCreateStudy = (
  name: string,
  pgn: string,
  defaultColor: "white" | "black",
) => {
  const study = createStudy(name, pgn, defaultColor);
  studies.value = [...studies.value, study];
  selectStudy(study);
};

const handleUpdateStudy = (study: Study) => {
  studies.value = studies.value.map((s) =>
    s.id === study.id ? updateStudy(s, study) : s,
  );
  if (currentStudy.value?.id === study.id) {
    currentStudy.value = study;
    loadStudyTree(study);
    playerColor.value = study.defaultColor || "white";
  }
};

const handleDeleteStudy = (id: string) => {
  studies.value = deleteStudy(studies.value, id);
  if (currentStudy.value?.id === id) {
    currentStudy.value = null;
    moveTree.value = null;
    currentNode.value = null;
    resetBoard();
  }
};

const selectStudy = (study: Study) => {
  currentStudy.value = study;
  playerColor.value = study.defaultColor || "white";
  loadStudyTree(study);
  mode.value = "edit";
};

const loadStudyTree = (study: Study) => {
  const tree = parsePgnToTree(study.pgn);
  moveTree.value = tree;
  currentNode.value = null;
  completedLines.value = new Set();
  totalLines.value = getLeafNodes(tree).length;
  resetBoard();
};

const resetBoard = () => {
  game.value = new Chess();
  lastMove.value = [];
  feedback.value = null;
  currentNode.value = null;
  updateGame();
};

const navigateToNode = (node: MoveNode) => {
  if (mode.value !== "edit") return;

  currentNode.value = node;
  const path = getPathToNode(node);

  game.value = new Chess();
  lastMove.value = [];

  for (const n of path) {
    if (n.move) {
      game.value.move(n.move);
      lastMove.value = [n.move.from, n.move.to];
    }
  }
  updateGame();
};

const isPlayerTurn = (): boolean => {
  const currentTurn = game.value.turn() === "w" ? "white" : "black";
  return currentTurn === playerColor.value;
};

const startDrill = () => {
  if (!moveTree.value) return;

  mode.value = "drill";
  completedLines.value = new Set();
  startNextLine();
};

const startNextLine = () => {
  if (!moveTree.value) return;

  const nextLine = findNextUnplayedLine(moveTree.value, completedLines.value);

  if (!nextLine || nextLine.length === 0) {
    alert("Congratulations! You completed all variations!");
    mode.value = "edit";
    return;
  }

  currentTargetLine.value = nextLine;
  currentTargetIndex.value = 0;

  game.value = new Chess();
  currentNode.value = null;
  lastMove.value = [];
  updateGame();

  setTimeout(() => {
    if (!isPlayerTurn()) {
      playOpponentMove();
    }
  }, 300);
};

const showFeedback = (type: "correct" | "variation" | "wrong") => {
  feedback.value = type;
  if (feedbackTimer.value) clearTimeout(feedbackTimer.value);
  feedbackTimer.value = window.setTimeout(() => {
    feedback.value = null;
  }, 800);
};

const getCurrentExpectedMoves = (): MoveNode[] => {
  if (!moveTree.value) return [];
  if (!currentNode.value) return moveTree.value.children;
  return currentNode.value.children;
};

const playOpponentMove = () => {
  if (currentTargetIndex.value >= currentTargetLine.value.length) {
    if (currentNode.value) {
      completedLines.value = new Set([
        ...completedLines.value,
        currentNode.value.id,
      ]);
    }
    setTimeout(startNextLine, 500);
    return;
  }

  const nextMoveNode = currentTargetLine.value[currentTargetIndex.value];
  if (nextMoveNode && nextMoveNode.move) {
    game.value.move(nextMoveNode.move);
    currentNode.value = nextMoveNode;
    lastMove.value = [nextMoveNode.move.from, nextMoveNode.move.to];
    currentTargetIndex.value++;
    updateGame();

    if (currentTargetIndex.value === currentTargetLine.value.length) {
      completedLines.value = new Set([
        ...completedLines.value,
        nextMoveNode.id,
      ]);
      setTimeout(startNextLine, 800);
    }
  }
};

const handleMove = (orig: string, dest: string) => {
  if (mode.value === "edit") {
    const move = game.value.move({ from: orig, to: dest, promotion: "q" });
    if (move) {
      const expectedMoves = getCurrentExpectedMoves();
      const matchingNode = expectedMoves.find((n) => n.move?.lan === move.lan);
      if (matchingNode) {
        currentNode.value = matchingNode;
      } else {
        currentNode.value = null;
      }
      lastMove.value = [orig, dest];
      updateGame();
    }
    return;
  }

  const move = game.value.move({ from: orig, to: dest, promotion: "q" });
  if (!move) return;

  const targetNode = currentTargetLine.value[currentTargetIndex.value];
  if (targetNode && targetNode.move?.lan === move.lan) {
    showFeedback("correct");
    currentNode.value = targetNode;
    lastMove.value = [orig, dest];
    currentTargetIndex.value++;
    updateGame();

    if (currentTargetIndex.value === currentTargetLine.value.length) {
      completedLines.value = new Set([...completedLines.value, targetNode.id]);
      setTimeout(startNextLine, 800);
    } else {
      setTimeout(playOpponentMove, 500);
    }
    return;
  }

  const expectedMoves = getCurrentExpectedMoves();
  const matchingNode = expectedMoves.find((n) => n.move?.lan === move.lan);

  if (matchingNode) {
    showFeedback("variation");
    currentNode.value = matchingNode;
    lastMove.value = [orig, dest];
    updateGame();

    const markVariationComplete = (node: MoveNode) => {
      if (node.children.length === 0) {
        completedLines.value = new Set([...completedLines.value, node.id]);
      } else if (node.children[0]) {
        markVariationComplete(node.children[0]);
      }
    };
    markVariationComplete(matchingNode);

    setTimeout(startNextLine, 1000);
  } else {
    showFeedback("wrong");
    game.value.undo();
    updateGame();
  }
};

const resetDrill = () => {
  completedLines.value = new Set();
  startNextLine();
};
</script>

<template>
  <div class="app-shell" :class="[`mode-${mode}`]">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'is-collapsed': isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo-row">
          <div class="logo">
            <div class="logo-mark">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M13 2L3 14H12V22L22 10H13V2Z" fill="currentColor" />
              </svg>
            </div>
            <div class="logo-text">
              BLITZ<span class="text-accent">DRILL</span>
            </div>
          </div>
          <button
            class="sidebar-toggle"
            @click="isSidebarCollapsed = !isSidebarCollapsed"
            :title="isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
          >
            <svg
              v-if="isSidebarCollapsed"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
        </div>
        <div class="tactical-version">VER 2.0.4 // TACTICAL_UNIT</div>
      </div>

      <div class="sidebar-content">
        <StudyManager
          :studies="studies"
          :current-study-id="currentStudy?.id || null"
          @select="selectStudy"
          @create="handleCreateStudy"
          @update="handleUpdateStudy"
          @delete="handleDeleteStudy"
        />
      </div>

      <div class="sidebar-appearance">
        <AppearanceSettings
          v-model:pieceSet="pieceSet"
          v-model:boardTheme="boardTheme"
        />
      </div>

      <div class="sidebar-footer">
        <div class="stats" v-if="currentStudy">
          <div class="stat-item">
            <span class="stat-label">Lines</span>
            <span class="stat-value">{{ totalLines }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Progress</span>
            <span class="stat-value"
              >{{
                Math.round((completedCount / (totalLines || 1)) * 100)
              }}%</span
            >
          </div>
        </div>
      </div>
    </aside>

    <!-- Main View -->
    <main class="main-view">
      <header class="main-header">
        <div class="header-left">
          <h2 v-if="currentStudy" class="study-title">
            {{ currentStudy.name }}
          </h2>
          <h2 v-else class="study-title">Select a Study</h2>
        </div>

        <div class="header-right" v-if="currentStudy">
          <!-- Color Toggle -->
          <div class="segmented-control color-control">
            <button
              :class="{ active: playerColor === 'white' }"
              @click="playerColor = 'white'"
              class="segment"
            >
              White
            </button>
            <button
              :class="{ active: playerColor === 'black' }"
              @click="playerColor = 'black'"
              class="segment"
            >
              Black
            </button>
          </div>

          <!-- Mode Toggle -->
          <div class="segmented-control mode-control">
            <button
              :class="{ active: mode === 'edit' }"
              @click="
                mode = 'edit';
                resetBoard();
              "
              class="segment"
            >
              Edit
            </button>
            <button
              :class="{ active: mode === 'drill' }"
              @click="startDrill"
              class="segment accent"
            >
              Drill
            </button>
          </div>
        </div>
      </header>

      <div class="workspace">
        <!-- Board Section -->
        <section class="board-section">
          <div class="board-wrapper">
            <ChessBoard
              :fen="fen"
              :dests="dests"
              :movable-color="movableColor"
              :last-move="lastMove"
              :feedback="feedback"
              :orientation="boardOrientation"
              :piece-set="pieceSet"
              :board-theme="boardTheme"
              :is-sidebar-collapsed="isSidebarCollapsed"
              @move="handleMove"
            />
          </div>

          <!-- Progress Bar (Drill Mode) -->
          <transition name="slide-up">
            <div v-if="mode === 'drill' && totalLines > 0" class="drill-ui">
              <div class="progress-container">
                <div class="progress-header">
                  <span>Tactical Completion</span>
                  <span>{{ completedCount }} / {{ totalLines }} lines</span>
                </div>
                <div class="progress-bar-wrap">
                  <div
                    class="progress-bar-fill"
                    :style="{
                      width: `${(completedCount / totalLines) * 100}%`,
                    }"
                  ></div>
                </div>
              </div>
              <button @click="resetDrill" class="btn-ghost">
                Restart Session
              </button>
            </div>
          </transition>
        </section>

        <!-- Data Section -->
        <aside class="data-section" v-if="currentStudy">
          <div class="panel-card">
            <div class="panel-header">
              <span class="panel-title">{{
                mode === "edit" ? "Move Tree" : "Drill Active"
              }}</span>
              <span v-if="mode === 'drill'" class="badge">TACTICAL</span>
            </div>
            <div class="panel-body">
              <transition name="fade" mode="out-in">
                <div v-if="mode === 'edit'" key="tree">
                  <MoveTree
                    v-if="moveTree"
                    :root="moveTree"
                    :current-node-id="currentNodeId"
                    :completed-lines="completedLines"
                    @select="navigateToNode"
                  />
                </div>
                <div v-else key="drill-info" class="drill-instructions">
                  <p>Execute the main lines and variations from your study.</p>
                  <div class="instruction-item">
                    <span class="dot correct"></span>
                    <span>Green flash for correct moves</span>
                  </div>
                  <div class="instruction-item">
                    <span class="dot variation"></span>
                    <span>Yellow flash for alternative lines</span>
                  </div>
                  <div class="instruction-item">
                    <span class="dot wrong"></span>
                    <span>Red shake for errors</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-deep);
  color: var(--text-main);
}

/* Sidebar Styling */
.sidebar {
  width: 320px;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: 10;
  position: relative;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.sidebar.is-collapsed {
  width: 64px;
}

.sidebar::after {
  content: "";
  position: absolute;
  top: 0;
  right: -1px;
  width: 1px;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--accent-primary),
    transparent
  );
  opacity: 0.2;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
  overflow: hidden;
  transition: padding 0.3s;
}

.is-collapsed .sidebar-header {
  padding: 2rem 0.75rem;
}

.logo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  min-width: 0;
  transition: flex-direction 0.3s;
}

.is-collapsed .logo-row {
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  font-size: 1.5rem;
  min-width: 0;
}

.logo-text {
  transition:
    opacity 0.2s,
    transform 0.2s;
  white-space: nowrap;
}

.is-collapsed .logo-text {
  opacity: 0;
  transform: translateX(-10px);
  pointer-events: none;
}

.sidebar-toggle {
  background: transparent;
  border: none;
  color: var(--text-dark);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.sidebar-toggle:hover {
  color: var(--accent-primary);
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-toggle svg {
  width: 20px;
  height: 20px;
}

.logo-mark {
  width: 24px;
  height: 24px;
  color: var(--accent-primary);
  filter: drop-shadow(0 0 8px var(--accent-primary));
  flex-shrink: 0;
}

.tactical-version {
  font-family: var(--font-mono);
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  color: var(--text-dark);
  white-space: nowrap;
  transition: opacity 0.2s;
}

.is-collapsed .tactical-version {
  opacity: 0;
}

.text-accent {
  color: var(--accent-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  transition: opacity 0.2s;
}

.is-collapsed .sidebar-content {
  opacity: 0;
  pointer-events: none;
}

.sidebar-appearance {
  padding: 1rem;
  border-top: 1px solid var(--border-subtle);
  transition: opacity 0.2s;
}

.is-collapsed .sidebar-appearance {
  opacity: 0;
  pointer-events: none;
}

.sidebar-footer {
  padding: 1.5rem;
  background: #000;
  border-top: 1px solid var(--border-subtle);
  transition: opacity 0.2s;
}

.is-collapsed .sidebar-footer {
  opacity: 0;
  pointer-events: none;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  color: var(--text-dark);
  font-weight: 800;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-bright);
  font-family: var(--font-mono);
}

/* Main View Styling */
.main-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.main-header {
  height: 64px;
  padding: 0 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-glass);
  backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border-subtle);
  z-index: 5;
}

.study-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
  color: var(--text-bright);
  letter-spacing: -0.03em;
}

.header-right {
  display: flex;
  gap: 2rem;
  align-items: center;
}

/* Segmented Control */
.segmented-control {
  display: flex;
  background: #000;
  padding: 2px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

.segment {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.segment.active {
  background: var(--bg-elevated);
  color: var(--text-bright);
}

.segment.accent.active {
  background: var(--accent-primary);
  color: #000;
  box-shadow: 0 0 15px rgba(204, 255, 0, 0.3);
}

/* Workspace Layout */
.workspace {
  flex: 1;
  display: flex;
  padding: 1.5rem 2rem;
  gap: 2.5rem;
  overflow: hidden;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.board-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.board-wrapper {
  position: relative;
  animation: fadeIn 0.6s ease-out;
}

.data-section {
  width: 400px;
  display: flex;
  flex-direction: column;
}

.panel-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  box-shadow: var(--shadow-lg);
}

.panel-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.badge {
  background: var(--accent-primary);
  color: var(--bg-deep);
  font-size: 0.65rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Drill UI */
.drill-ui {
  width: 100%;
  max-width: 600px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  padding: 1.25rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.progress-container {
  flex: 1;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-dim);
}

.progress-bar-wrap {
  height: 6px;
  background: var(--bg-deep);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: 3px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 0 10px var(--accent-primary);
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--text-dark);
  color: var(--text-main);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--text-dim);
}

/* Drill Instructions */
.drill-instructions {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  color: var(--text-dim);
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.correct {
  background: var(--accent-success);
  box-shadow: 0 0 8px var(--accent-success);
}
.dot.variation {
  background: var(--accent-warning);
  box-shadow: 0 0 8px var(--accent-warning);
}
.dot.wrong {
  background: var(--accent-error);
  box-shadow: 0 0 8px var(--accent-error);
}

/* Mode-based UI shifts */
.mode-drill .main-header {
  border-bottom-color: var(--accent-primary);
}

.mode-drill .logo-icon {
  color: var(--accent-primary);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 1200px) {
  .workspace {
    flex-direction: column;
    overflow-y: auto;
  }
  .data-section {
    width: 100%;
  }
}
</style>
