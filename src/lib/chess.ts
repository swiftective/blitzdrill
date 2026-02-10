import { Chess, type Move } from 'chess.js';

export interface MoveNode {
  id: string;
  move: Move | null; // null for root
  san: string;
  fen: string;
  children: MoveNode[];
  parent: MoveNode | null;
  isMainLine: boolean;
}

export interface Study {
  id: string;
  name: string;
  pgn: string;
  defaultColor: 'white' | 'black';
  createdAt: number;
  updatedAt: number;
}

export interface DrillState {
  completedLines: Set<string>; // Set of leaf node IDs that have been completed
  currentNodeId: string;
}

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Parse PGN into a tree structure
export const parsePgnToTree = (pgn: string): MoveNode => {
  const root: MoveNode = {
    id: 'root',
    move: null,
    san: '',
    fen: new Chess().fen(),
    children: [],
    parent: null,
    isMainLine: true,
  };

  const cleanPgn = pgn
    .replace(/\{[\s\S]*?\}/g, '') // Remove comments
    .replace(/\$\d+/g, '') // Remove NAGs
    .replace(/\d+\.+/g, ' ') // Remove move numbers
    .replace(/\s+/g, ' ')
    .replace(/1-0|0-1|1\/2-1\/2|\*/g, '') // Remove results
    .trim();

  if (!cleanPgn) return root;

  const tokens = tokenize(cleanPgn);
  buildTree(tokens, root, new Chess(), true);

  return root;
};

const tokenize = (str: string): string[] => {
  const tokens: string[] = [];
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(' || char === ')' || char === ' ') {
      if (current) tokens.push(current);
      if (char !== ' ') tokens.push(char);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) tokens.push(current);
  return tokens;
};

const buildTree = (
  tokens: string[],
  parentNode: MoveNode,
  game: Chess,
  isMainLine: boolean
): number => {
  let i = 0;
  let currentParent = parentNode;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token === '(') {
      // Start of variation - find the matching closing paren
      let depth = 1;
      let j = i + 1;
      while (j < tokens.length && depth > 0) {
        if (tokens[j] === '(') depth++;
        if (tokens[j] === ')') depth--;
        j++;
      }

      // Get variation tokens (excluding parens)
      const variationTokens = tokens.slice(i + 1, j - 1);

      // Variation starts from the parent of the last move
      if (currentParent.parent) {
        const branchPoint = currentParent.parent;
        const branchGame = new Chess(branchPoint.fen);
        buildTree(variationTokens, branchPoint, branchGame, false);
      }

      i = j;
    } else if (token === ')') {
      // End of variation
      return i + 1;
    } else {
      // Regular move
      try {
        if (!token) {
          i++;
          continue;
        }
        const move = game.move(token);
        if (move) {
          const node: MoveNode = {
            id: generateId(),
            move,
            san: move.san,
            fen: game.fen(),
            children: [],
            parent: currentParent,
            isMainLine,
          };
          currentParent.children.push(node);
          currentParent = node;
        }
      } catch {
        // Invalid move, skip
      }
      i++;
    }
  }

  return i;
};

// Get all leaf nodes (end of lines)
export const getLeafNodes = (node: MoveNode): MoveNode[] => {
  if (node.children.length === 0) {
    return [node];
  }
  return node.children.flatMap(getLeafNodes);
};

// Get all lines as arrays of nodes
export const getAllLines = (root: MoveNode): MoveNode[][] => {
  const leaves = getLeafNodes(root);
  return leaves.map((leaf) => {
    const line: MoveNode[] = [];
    let current: MoveNode | null = leaf;
    while (current && current.move) {
      line.unshift(current);
      current = current.parent;
    }
    return line;
  });
};

// Find node by ID
export const findNodeById = (root: MoveNode, id: string): MoveNode | null => {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
};

// Get path from root to node
export const getPathToNode = (node: MoveNode): MoveNode[] => {
  const path: MoveNode[] = [];
  let current: MoveNode | null = node;
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  return path;
};

// Find next unplayed line
export const findNextUnplayedLine = (
  root: MoveNode,
  completedLines: Set<string>
): MoveNode[] | null => {
  const allLines = getAllLines(root);
  for (const line of allLines) {
    const leafId = line[line.length - 1]?.id;
    if (leafId && !completedLines.has(leafId)) {
      return line;
    }
  }
  return null;
};

// Storage functions
const STORAGE_KEY = 'blitzdrill_studies';

export const loadStudies = (): Study[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveStudies = (studies: Study[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(studies));
};

export const createStudy = (name: string, pgn: string, defaultColor: 'white' | 'black' = 'white'): Study => {
  const now = Date.now();
  return {
    id: generateId(),
    name,
    pgn,
    defaultColor,
    createdAt: now,
    updatedAt: now,
  };
};

export const updateStudy = (study: Study, updates: Partial<Study>): Study => {
  return {
    ...study,
    ...updates,
    updatedAt: Date.now(),
  };
};

export const deleteStudy = (studies: Study[], id: string): Study[] => {
  return studies.filter((s) => s.id !== id);
};
