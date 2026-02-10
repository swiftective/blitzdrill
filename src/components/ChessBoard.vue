<script setup lang="ts">
import {
  onMounted,
  ref,
  watch,
  onBeforeUnmount,
  nextTick,
  computed,
} from "vue";
import { Chessground } from "@lichess-org/chessground";
import type { Config } from "@lichess-org/chessground/config";
import type { Api } from "@lichess-org/chessground/api";

const props = defineProps<{
  fen: string;
  dests: Map<string, string[]>;
  movableColor: "white" | "black" | "both" | "none";
  lastMove?: string[];
  orientation?: "white" | "black";
  feedback?: "correct" | "variation" | "wrong" | null;
  pieceSet?: string;
  boardTheme?: string;
  isSidebarCollapsed?: boolean;
}>();

const emit = defineEmits<{
  move: [orig: string, dest: string];
}>();

const boardElement = ref<HTMLElement | null>(null);
let cg: Api | null = null;
let resizeObserver: ResizeObserver | null = null;

const pieceUrls = computed(() => {
  const base = import.meta.env.BASE_URL;
  const set = props.pieceSet || "cburnett";
  const roles = ["P", "N", "B", "R", "Q", "K"];
  const colors = ["w", "b"];
  const urls: Record<string, string> = {};

  colors.forEach((c) => {
    roles.forEach((r) => {
      const key = `${c}${r}`;
      if (set === "monarchy") {
        urls[key] = `url('${base}/pieces/${set}/${key}.webp')`;
      } else if (set === "mono") {
        urls[key] = `url('${base}/pieces/${set}/${r}.svg')`;
      } else {
        urls[key] = `url('${base}/pieces/${set}/${key}.svg')`;
      }
    });
  });
  return urls;
});

const boardUrl = computed(() => {
  const base = import.meta.env.BASE_URL;
  const boardImg = props.boardTheme || "brown";
  const boardExt = [
    "blue",
    "brown",
    "green",
    "green-plastic",
    "purple",
  ].includes(boardImg)
    ? "png"
    : "jpg";
  return `url('${base}/board/${boardImg}.${boardExt}')`;
});

const initBoard = () => {
  if (!boardElement.value) return;

  const turn = props.fen.split(" ")[1] === "w" ? "white" : "black";

  const config: Config = {
    fen: props.fen,
    orientation: props.orientation || "white",
    lastMove: props.lastMove,
    turnColor: turn,
    movable: {
      free: false,
      color: props.movableColor === "none" ? undefined : props.movableColor,
      dests: props.dests,
      showDests: true,
    },
    premovable: {
      enabled: false,
    },
    draggable: {
      showGhost: true,
      distance: 3,
    },
    animation: {
      enabled: true,
      duration: 250,
    },
    drawable: {
      enabled: true,
    },
    highlight: {
      lastMove: true,
      check: true,
    },
    events: {
      move: (orig: string, dest: string) => {
        emit("move", orig, dest);
      },
    },
  };

  cg = Chessground(boardElement.value, config);

  resizeObserver = new ResizeObserver(() => {
    cg?.redrawAll();
  });
  resizeObserver.observe(boardElement.value);
};

onMounted(initBoard);

// Watch for appearance changes
watch(
  () => [props.pieceSet, props.boardTheme],
  () => {
    // Trigger a re-render of pieces by slightly changing FEN or just redrawing
    cg?.redrawAll();
  },
  { deep: true },
);

let updateScheduled = false;
const scheduleUpdate = () => {
  if (updateScheduled) return;
  updateScheduled = true;
  nextTick(() => {
    if (!cg) return;

    const turn = props.fen.split(" ")[1] === "w" ? "white" : "black";

    cg.set({
      fen: props.fen,
      lastMove: props.lastMove,
      turnColor: turn,
      movable: {
        color: props.movableColor === "none" ? undefined : props.movableColor,
        dests: props.dests,
      },
    });

    cg.redrawAll();
    updateScheduled = false;
  });
};

watch(() => props.fen, scheduleUpdate);
watch(() => props.dests, scheduleUpdate, { deep: false });
watch(() => props.movableColor, scheduleUpdate);
watch(() => props.lastMove, scheduleUpdate);

watch(
  () => props.orientation,
  (newOrientation) => {
    cg?.set({ orientation: newOrientation || "white" });
    nextTick(() => cg?.redrawAll());
  },
);

watch(
  () => props.isSidebarCollapsed,
  () => {
    // Redraw multiple times during the transition to ensure click coordinates are updated
    const start = performance.now();
    const duration = 400; // slightly longer than the 0.3s CSS transition

    const step = (now: number) => {
      if (!cg) return;
      cg.redrawAll();
      if (now - start < duration) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  },
);

onBeforeUnmount(() => {
  cg?.destroy();
  resizeObserver?.disconnect();
});
</script>

<template>
  <div class="board-container">
    <div
      ref="boardElement"
      class="cg-wrap"
      :class="{
        'feedback-correct': feedback === 'correct',
        'feedback-variation': feedback === 'variation',
        'feedback-wrong': feedback === 'wrong',
      }"
    ></div>
  </div>
</template>

<style>
/* Global Piece Styles */
.cg-wrap piece.pawn.white {
  background-image: var(--pawn-white);
}
.cg-wrap piece.pawn.black {
  background-image: var(--pawn-black);
}
.cg-wrap piece.knight.white {
  background-image: var(--knight-white);
}
.cg-wrap piece.knight.black {
  background-image: var(--knight-black);
}
.cg-wrap piece.bishop.white {
  background-image: var(--bishop-white);
}
.cg-wrap piece.bishop.black {
  background-image: var(--bishop-black);
}
.cg-wrap piece.rook.white {
  background-image: var(--rook-white);
}
.cg-wrap piece.rook.black {
  background-image: var(--rook-black);
}
.cg-wrap piece.queen.white {
  background-image: var(--queen-white);
}
.cg-wrap piece.queen.black {
  background-image: var(--queen-black);
}
.cg-wrap piece.king.white {
  background-image: var(--king-white);
}
.cg-wrap piece.king.black {
  background-image: var(--king-black);
}
</style>

<style scoped>
.board-container {
  position: relative;
  /* CSS Variables for pieces */
  --pawn-white: v-bind("pieceUrls.wP");
  --pawn-black: v-bind("pieceUrls.bP");
  --knight-white: v-bind("pieceUrls.wN");
  --knight-black: v-bind("pieceUrls.bN");
  --bishop-white: v-bind("pieceUrls.wB");
  --bishop-black: v-bind("pieceUrls.bB");
  --rook-white: v-bind("pieceUrls.wR");
  --rook-black: v-bind("pieceUrls.bR");
  --queen-white: v-bind("pieceUrls.wQ");
  --queen-black: v-bind("pieceUrls.bQ");
  --king-white: v-bind("pieceUrls.wK");
  --king-black: v-bind("pieceUrls.bK");
}

.board-container :deep(cg-board) {
  background-image: v-bind(boardUrl) !important;
  background-size: cover !important;
  background-position: center !important;
}
</style>
