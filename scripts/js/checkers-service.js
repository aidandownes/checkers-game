"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
class Checkers {
    constructor() {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
    }
    getCurrentBoard() {
        return this.boards[this.boards.length - 1];
    }
    tryMove(source, destination) {
        let board = this.getCurrentBoard();
        let newBoard = board.move(source, destination);
        if (board !== newBoard) {
            this.boards.push(newBoard);
            return true;
        }
        else {
            return false;
        }
    }
}
exports.Checkers = Checkers;
class CheckersProvider {
    $get($injector) {
        return $injector.instantiate(Checkers);
    }
}
exports.CheckersProvider = CheckersProvider;
