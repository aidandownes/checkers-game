"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const uct_1 = require('./uct');
const game_model_1 = require('./game-model');
class Checkers {
    constructor($timeout) {
        this.$timeout = $timeout;
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
        this.uctSearch = new uct_1.UctSearch(1000);
    }
    getComputerPlayer() {
        return game_model_1.Player.Two;
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
        let move = this.uctSearch.search(this.getCurrentBoard());
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
