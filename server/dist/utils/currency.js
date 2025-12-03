"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountToWords = void 0;
const number_to_words_1 = require("number-to-words");
const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const amountToWords = (amount) => {
    const [takaPart, paisaPart] = amount.toFixed(2).split('.');
    const taka = parseInt(takaPart, 10);
    const paisa = parseInt(paisaPart, 10);
    const takaText = taka === 0 ? 'Zero taka' : `${capitalize((0, number_to_words_1.toWords)(taka))} taka`;
    const paisaText = paisa > 0 ? ` and ${(0, number_to_words_1.toWords)(paisa)} paisa` : '';
    return `${takaText}${paisaText} only`;
};
exports.amountToWords = amountToWords;
