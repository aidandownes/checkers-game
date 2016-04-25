"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const mcts_1 = require('./mcts');
var checkers_bitboard_2 = require('./checkers-bitboard');
exports.Player = checkers_bitboard_2.Player;
class Checkers {
    constructor($timeout) {
        this.$timeout = $timeout;
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
        this.computeOptions = new mcts_1.ComputeOptions(10000, 5000);
    }
    getComputerPlayer() {
        return checkers_bitboard_1.Player.Two;
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
        let { success, board } = currentBoard.tryMove({ source: source, destination: destination, player: currentBoard.player });
        if (success) {
            this.boards.push(board);
            if (board.player == this.getComputerPlayer()) {
                this.$timeout(this.doComputerPlayerMove.bind(this), 500);
            }
            return true;
        }
        else {
            return false;
        }
    }
    doComputerPlayerMove() {
        let move = mcts_1.computeMove(this.getCurrentBoard(), this.computeOptions);
        if (move) {
            this.tryMove(move.source, move.destination);
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
