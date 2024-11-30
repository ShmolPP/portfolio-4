import * as readline from "node:readline"

readline.emitKeypressEvents(process.stdin);
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}

process.stdin.on("keypress", (str, key) => {

    if (key.name == KEY_ID.escape) {
        process.exit();
    }

    if (KEY_STATES.hasOwnProperty(key.name)) {
        KEY_STATES[key.name] = true;
    }
});

const KEY_ID =
{
    down: "down",
    up: "up",
    left: "left",
    right: "right",
    return: "return",
    escape: "escape",
    r: "r"
}

const KEY_STATES = Object.keys(KEY_ID).reduce((prev, cur) => {
    prev[cur] = false;
    return prev;
}, {});


function readKeyState(key) {
    let value = KEY_STATES[key];
    KEY_STATES[key] = false;
    return value;
}

const KeyBoardManager = {

    isEnterPressed: () => {
        return readKeyState(KEY_ID.return);
    },

    isDownPressed: () => {

        return readKeyState(KEY_ID.down);
    },
    isUpPressed: () => {
        return readKeyState(KEY_ID.up);
    },
    isLeftPressed: () => {
        return readKeyState(KEY_ID.left);
    },
    isRightPressed: () => {
        return readKeyState(KEY_ID.right);
    },
    isRotatePressed: () => {
        return readKeyState(KEY_ID.r);
    }

}


export default KeyBoardManager;
