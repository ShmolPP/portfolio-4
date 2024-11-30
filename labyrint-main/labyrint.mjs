import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const STARTING_LEVEL = "start";
const levels = loadLevelMappings();

function loadLevelMappings(source = CONST.LEVEL_LISTING_FILE) {
  const data = readRecordFile(source);
  const levelMap = {};
  for (const item of data) {
    const [key, value] = item.split(":").map(str => str.trim());
    if (key && value) {
      levelMap[key] = value;
    }
  }
  return levelMap;
}

let level = readMapFile(levels[STARTING_LEVEL]);

const COLORS = {
  "█": ANSI.COLOR.LIGHT_GRAY,  // Wall
  "H": ANSI.COLOR.RED,         // Hero
  "$": ANSI.COLOR.YELLOW,      // Loot
  "B": ANSI.COLOR.GREEN,       // Friendly NPC
  "D": ANSI.COLOR.BLUE,        // Door
  "♨": ANSI.COLOR.WHITE,       // Teleport
  "X": ANSI.COLOR.BLACK,       // Enemy NPC
};

const SYMBOLS = {
  EMPTY: " ",
  WALL: "█",
  HERO: "H",
  LOOT: "$",
  DOOR: "D",
  TELEPORT: "\u2668",  // "♨"
  NPC_ENEMY: "X",
};

const INTERACTABLES = [SYMBOLS.LOOT, SYMBOLS.EMPTY, SYMBOLS.DOOR, SYMBOLS.TELEPORT];

const PLAYER_MAX_HP = 10;
let playerPosition = { row: null, col: null };
let playerStats = { hp: 8, cash: 0 };
let npcList = [];
let eventMessage = "";
let needsRedraw = true;

const levelTransitions = {
  "start": { "D": "aSharpPlace" },
  "aSharpPlace": { "D": "thirdLevel" },
  "thirdLevel": { "D": "aSharpPlace" },
};

class Labyrinth {
  constructor() {
    this.currentLevelName = STARTING_LEVEL;
  }

  update() {
    if (playerPosition.row === null) {
      this.locatePlayer();
    }

    const { dRow, dCol } = this.getMovementInput();

    const targetRow = playerPosition.row + dRow;
    const targetCol = playerPosition.col + dCol;

    if (this.isOutOfBounds(targetRow, targetCol)) {
      return;
    }

    const targetSymbol = level[targetRow][targetCol];

    if (INTERACTABLES.includes(targetSymbol)) {
      this.handleInteraction(targetSymbol, targetRow, targetCol);
    } else if (targetSymbol === SYMBOLS.NPC_ENEMY) {
      playerStats.hp -= 1;
      eventMessage = "You bumped into an enemy!";
      needsRedraw = true;
    }

    this.updateNPCs();
  }

  locatePlayer() {
    for (let row = 0; row < level.length; row++) {
      for (let col = 0; col < level[row].length; col++) {
        if (level[row][col] === SYMBOLS.HERO) {
          playerPosition.row = row;
          playerPosition.col = col;
          return;
        }
      }
    }
  }

  getMovementInput() {
    let dRow = 0;
    let dCol = 0;

    if (KeyBoardManager.isUpPressed()) dRow = -1;
    if (KeyBoardManager.isDownPressed()) dRow = 1;
    if (KeyBoardManager.isLeftPressed()) dCol = -1;
    if (KeyBoardManager.isRightPressed()) dCol = 1;

    return { dRow, dCol };
  }

  isOutOfBounds(row, col) {
    return row < 0 || row >= level.length || col < 0 || col >= level[0].length;
  }

  handleInteraction(symbol, row, col) {
    if (symbol === SYMBOLS.LOOT) {
      const lootAmount = Math.floor(Math.random() * 8) + 3;
      playerStats.cash += lootAmount;
      eventMessage = `You gained ${lootAmount}$`;
    } else if (symbol === SYMBOLS.DOOR) {
      const nextLevel = levelTransitions[this.currentLevelName][symbol];
      if (nextLevel) {
        this.loadLevel(nextLevel);
        return;
      } else {
        eventMessage = "The door is locked.";
      }
    } else if (symbol === SYMBOLS.TELEPORT) {
      this.teleportPlayer(row, col);
      return;
    }

    level[playerPosition.row][playerPosition.col] = SYMBOLS.EMPTY;
    level[row][col] = SYMBOLS.HERO;
    playerPosition.row = row;
    playerPosition.col = col;
    needsRedraw = true;
  }

  updateNPCs() {
    for (const npc of npcList) {
      npc.moveCounter++;

      if (npc.moveCounter >= npc.moveDelay) {
        npc.moveCounter = 0;

        let nextRow = npc.row + npc.direction;
        const distance = Math.abs(nextRow - npc.startRow);

        if (
          distance > 2 ||
          level[nextRow][npc.col] === SYMBOLS.WALL ||
          level[nextRow][npc.col] === SYMBOLS.DOOR
        ) {
          npc.direction *= -1;
          nextRow = npc.row + npc.direction;
        }

        const nextSymbol = level[nextRow][npc.col];

        if (nextSymbol === SYMBOLS.EMPTY || nextSymbol === SYMBOLS.HERO) {
          level[npc.row][npc.col] = SYMBOLS.EMPTY;

          if (nextSymbol === SYMBOLS.HERO) {
            playerStats.hp -= 1;
            eventMessage = "An enemy hit you!";
          }

          level[nextRow][npc.col] = SYMBOLS.NPC_ENEMY;
          npc.row = nextRow;
          needsRedraw = true;
        } else {
          npc.direction *= -1;
        }
      }
    }
  }

  teleportPlayer(row, col) {
    const teleportPositions = [];

    for (let r = 0; r < level.length; r++) {
      for (let c = 0; c < level[r].length; c++) {
        if (level[r][c] === SYMBOLS.TELEPORT) {
          teleportPositions.push({ row: r, col: c });
        }
      }
    }

    const destinations = teleportPositions.filter(
      pos => pos.row !== row || pos.col !== col
    );

    if (destinations.length > 0) {
      const destination = destinations[0];
      level[playerPosition.row][playerPosition.col] = SYMBOLS.EMPTY;
      level[destination.row][destination.col] = SYMBOLS.HERO;
      playerPosition.row = destination.row;
      playerPosition.col = destination.col;
      eventMessage = "You have been teleported!";
      needsRedraw = true;
    } else {
      eventMessage = "Teleportation failed.";
    }
  }

  loadLevel(levelName) {
    level = readMapFile(levels[levelName]);
    this.currentLevelName = levelName;
    playerPosition.row = null;
    playerPosition.col = null;

    npcList = [];
    for (let row = 0; row < level.length; row++) {
      for (let col = 0; col < level[row].length; col++) {
        if (level[row][col] === SYMBOLS.NPC_ENEMY) {
          npcList.push({
            row: row,
            col: col,
            startRow: row,
            direction: 1,
            moveCounter: 0,
            moveDelay: 2,
          });
        }
      }
    }

    eventMessage = `Entered ${levelName}`;
    needsRedraw = true;
  }

  draw() {
    if (!needsRedraw) return;
    needsRedraw = false;

    console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

    let output = this.renderHUD();

    for (let row = 0; row < level.length; row++) {
      let rowOutput = "";
      for (let col = 0; col < level[row].length; col++) {
        const symbol = level[row][col];
        const color = COLORS[symbol] || "";
        rowOutput += color + symbol + ANSI.COLOR_RESET;
      }
      output += rowOutput + "\n";
    }

    console.log(output);
    if (eventMessage) {
      console.log(eventMessage);
      eventMessage = "";
    }
  }

  renderHUD() {
    const healthBar = `Life: [${ANSI.COLOR.RED}${"♥".repeat(playerStats.hp)}${ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY}${"♥".repeat(PLAYER_MAX_HP - playerStats.hp)}${ANSI.COLOR_RESET}]`;
    const cashDisplay = `$: ${playerStats.cash}`;
    return `${healthBar} ${cashDisplay}\n`;
  }
}

export default Labyrinth;
