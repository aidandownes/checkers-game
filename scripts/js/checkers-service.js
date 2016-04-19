"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
var checkers_bitboard_2 = require('./checkers-bitboard');
exports.Player = checkers_bitboard_2.Player;
class Checkers {
    constructor() {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
    }
    getCurrentPlayer() {
        return this.getCurrentBoard().player;
    }
    getCurrentBoard() {
        return this.boards[this.boards.length - 1];
    }
    getStartTime() {
        return this.startTime;
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
