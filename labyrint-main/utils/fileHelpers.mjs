import fs from "node:fs";
import { MAP_DIRECTORY } from "../constants.mjs";


function readMapFile(fileName) {
    let data = fs.readFileSync(`${MAP_DIRECTORY}${fileName}`, { encoding: "utf8" });
    data = data.split("\n");
    data = data.reduce((prev, curr) => {
        prev.push(curr.split(""));
        return prev;
    }, []);
    return data;
}

function readRecordFile(fileName) {
    let data = fs.readFileSync(fileName, { encoding: "utf8" });
    return data.split("\n");
}

export { readMapFile, readRecordFile }