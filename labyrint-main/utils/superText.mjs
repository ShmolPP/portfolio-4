import { ANSI } from "./ANSI.mjs"
import { stdin, stdout } from 'node:process';

class Text {

    row = 0;
    column = 0;
    text = "";
    markup = [];

    constructor(text) {
        this.appendText(text);
    }

    appendText(newText) {
        this.text += newText;
        this.markup.push(newText);
        return this;
    }

    addANSI(ansiCode) {
        this.markup.push(ansiCode);
        return this;
    }

    addBoldFont() {
        return this.addANSI(ANSI.TEXT.BOLD);
    }

    stopBoldFont() {
        return this.addANSI(ANSI.TEXT.BOLD_OFF);
    }

    addColor(color) {
        return this.addANSI(color);
    }

    position(row, col) {
        this.markup.unshift(ANSI.moveCursorTo(row, col));
        this.row = row;
        this.column = col;
        return this;
    }

    centerHorizontaly() {
        let width = stdout.columns;
        let textWidth = this.text.length;
        let center = Math.ceil((width - textWidth) / 2);
        this.position(this.row, center);
        return this;
    }

    toString() {
        return this.markup.join("") + ANSI.RESET;
    }

};


// Usage: new Text(".....");
export default Text