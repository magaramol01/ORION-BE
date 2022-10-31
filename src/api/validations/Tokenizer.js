'use strict';

const {Util} = require('../utils/util');

class Tokenizer {

    constructor() {
        this.inst = null;
        this.tokens = []
    }

    static getInst() {
        if (!this.inst)
            this.inst = new Tokenizer();
        return this.inst
    }

    tokenize(str) {
        str = "(" + str + ")";
        str = str.trim();
        str = str.replace(/\s/g, '');
        let s = '';
        for (let index = 0; index < str.length; index++) {
            s += str[index];
            const peek = str[index + 1];
            if (Util._isNumber(s.trim()) && !Util._isNumber(peek)) {
                if(peek!="-") {
                    this.tokens.push({type: 'STR_NUM', value: s.trim()});
                    s = '';
                }
            }
            if (s.trim() === '(' || s.trim() === ')') {
                s.trim() === '(' ? this.tokens.push({ type: 'LPAREN', value: "(" }) : this.tokens.push({ type: 'RPAREN', value: ")" });
                s = '';
            }
            if (Util._isLogicalOperator(s.trim()) && !Util._isLogicalOperator(peek)) {
                this.tokens.push({ type: 'OP', value: s.trim() });
                s = '';
            }
            if (s === ';' || s === '\n') {
                this.tokens.push({ type: 'EOL' });
                s = '';
            }
            if (index === (str.length - 1)) {
                this.tokens.push({ type: 'EOF' });
                s = '';
            }
        }
        return this.tokens;
    }
}

module.exports = Tokenizer;
