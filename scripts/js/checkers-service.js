"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const game_model_1 = require('./game-model');
var uct_1 = require('./uct');
exports.UctSearchService = uct_1.UctSearchService;
const DEFAULT_MAX_TIME_MS = 500;
const DEFAULT_MAX_ITERATIONS = 10000;
class Checkers {
    constructor($timeout, uctSearchService) {
        this.$timeout = $timeout;
        this.uctSearchService = uctSearchService;
        this.setComputeOptions({
            maxIterations: DEFAULT_MAX_ITERATIONS,
            maxTime: DEFAULT_MAX_TIME_MS
        });
        this.reset();
    }
    reset() {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
        this.searchResult = null;
    }
    setComputeOptions(computeOptions) {
        this.computeOptions = computeOptions;
    }
    getComputeOptions() {
        return this.computeOptions;
    }
    getComputerPlayer() {
        return game_model_1.Player.Two;
    }
    getHumanPlayer() {
        return game_model_1.Player.One;
    }
    getOpponent(player) {
        if (player == game_model_1.Player.None)
            return game_model_1.Player.None;
        return player == game_model_1.Player.One ? game_model_1.Player.Two : game_model_1.Player.One;
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
    getSearchResult() {
        return this.searchResult;
    }
    tryMove(source, destination) {
        let currentBoard = this.getCurrentBoard();
        let move = { source: source, destination: destination, player: currentBoard.player };
        let { success, board } = currentBoard.tryMove(move);
        if (success) {
            this.boards.push(board);
            this.lastMove = move;
            console.log(`Last move is (${move.source} => ${move.destination})`);
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
        this.searchResult = this.uctSearchService.search(this.getCurrentBoard(), this.computeOptions.maxIterations, this.computeOptions.maxTime);
        if (this.searchResult.move) {
            let move = this.searchResult.move;
            this.tryMove(move.source, move.destination);
        }
    }
    getLastMove() {
        return this.lastMove;
    }
}
exports.Checkers = Checkers;
class CheckersProvider {
    $get($injector) {
        return $injector.instantiate(Checkers);
    }
}
exports.CheckersProvider = CheckersProvider;
