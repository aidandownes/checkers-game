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
        let currentBoard = this.getCurrentBoard();
        let { success, board } = currentBoard.tryMove(source, destination);
        if (success) {
            this.boards.push(board);
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
