import { Category } from "./data";

export type AacCellType = "speak" | "navigate";

export type AacCell = {
  id: string;
  label: string;
  iconName: string;
  imageDataUrl?: string;
  type: AacCellType;
  textToSpeak?: string;
  targetBoardId?: string;
};

export type AacBoard = {
  id: string;
  name: string;
  colorClass: string;
  cells: AacCell[];
};

export type AacBoardGraph = {
  homeBoardId: string;
  boardOrder: string[];
  boardsById: Record<string, AacBoard>;
};

const HOME_BOARD_ID = "board-home";

export const buildBoardsFromCategories = (categories: Category[]): AacBoardGraph => {
  const boardsById: Record<string, AacBoard> = {};
  const boardOrder: string[] = [HOME_BOARD_ID];

  const homeCells: AacCell[] = categories.map(category => {
    const targetBoardId = `board-${category.id}`;
    return {
      id: `go-${category.id}`,
      label: category.name,
      iconName: category.items[0]?.iconName ?? "ArrowRight",
      type: "navigate",
      targetBoardId,
    };
  });

  boardsById[HOME_BOARD_ID] = {
    id: HOME_BOARD_ID,
    name: "Inicio",
    colorClass: "bg-slate-100 border-slate-300 hover:bg-slate-200",
    cells: homeCells,
  };

  categories.forEach(category => {
    const boardId = `board-${category.id}`;
    boardOrder.push(boardId);

    boardsById[boardId] = {
      id: boardId,
      name: category.name,
      colorClass: category.color,
      cells: category.items.map(item => ({
        id: item.id,
        label: item.word,
        iconName: item.iconName,
        type: "speak",
        textToSpeak: item.word,
      })),
    };
  });

  return {
    homeBoardId: HOME_BOARD_ID,
    boardOrder,
    boardsById,
  };
};

const isCellType = (value: unknown): value is AacCellType => value === "speak" || value === "navigate";

export const isValidBoardGraph = (value: unknown): value is AacBoardGraph => {
  if (!value || typeof value !== "object") return false;

  const graph = value as AacBoardGraph;
  if (typeof graph.homeBoardId !== "string") return false;
  if (!Array.isArray(graph.boardOrder) || !graph.boardOrder.every(item => typeof item === "string")) {
    return false;
  }
  if (!graph.boardsById || typeof graph.boardsById !== "object") return false;

  const boardIds = Object.keys(graph.boardsById);
  if (boardIds.length === 0) return false;

  return boardIds.every(boardId => {
    const board = graph.boardsById[boardId];
    if (!board || typeof board !== "object") return false;
    if (typeof board.id !== "string" || typeof board.name !== "string" || typeof board.colorClass !== "string") {
      return false;
    }
    if (!Array.isArray(board.cells)) return false;

    return board.cells.every(cell => {
      if (!cell || typeof cell !== "object") return false;
      if (typeof cell.id !== "string" || typeof cell.label !== "string" || typeof cell.iconName !== "string") {
        return false;
      }
      if (cell.imageDataUrl !== undefined && typeof cell.imageDataUrl !== "string") {
        return false;
      }
      if (!isCellType(cell.type)) return false;
      if (cell.type === "navigate" && typeof cell.targetBoardId !== "string") return false;
      return true;
    });
  });
};

export const cloneBoardGraph = (graph: AacBoardGraph): AacBoardGraph => ({
  homeBoardId: graph.homeBoardId,
  boardOrder: [...graph.boardOrder],
  boardsById: Object.fromEntries(
    Object.entries(graph.boardsById).map(([boardId, board]) => [
      boardId,
      {
        ...board,
        cells: board.cells.map(cell => ({ ...cell })),
      },
    ])
  ),
});