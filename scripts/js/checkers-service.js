"use strict";
var checkers_bitboard_1 = require('./checkers-bitboard');
var game_model_1 = require('./game-model');
var uct_1 = require('./uct');
exports.UctSearchService = uct_1.UctSearchService;
var game_model_2 = require('./game-model');
exports.Player = game_model_2.Player;
var DEFAULT_MAX_TIME_MS = 500;
var DEFAULT_MAX_ITERATIONS = 10000;
var Checkers = (function () {
    function Checkers($timeout, uctSearchService) {
        this.$timeout = $timeout;
        this.uctSearchService = uctSearchService;
        this.computerPlayer = game_model_1.Player.Two;
        this.humanPlayer = game_model_1.Player.One;
        this.computeOptions = {
            maxIterations: DEFAULT_MAX_ITERATIONS,
            maxTime: DEFAULT_MAX_TIME_MS
        };
        this.reset();
    }
    Checkers.prototype.reset = function () {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
        this.searchResult = null;
        this.lastMove = null;
    };
    Checkers.prototype.getCurrentPlayer = function () {
        return this.getCurrentBoard().player;
    };
    Checkers.prototype.getCurrentBoard = function () {
        return this.boards[this.boards.length - 1];
    };
    Checkers.prototype.getPlayablePieces = function () {
        if (this.getCurrentPlayer() != this.humanPlayer) {
            return [];
        }
        return this.getCurrentBoard().getMoves().map(function (m) { return m.source; });
    };
    Checkers.prototype.getOpponent = function (player) {
        if (player == game_model_1.Player.None)
            return game_model_1.Player.None;
        return player == game_model_1.Player.One ? game_model_1.Player.Two : game_model_1.Player.One;
    };
    Checkers.prototype.tryMove = function (source, destination) {
        var currentBoard = this.getCurrentBoard();
        var move = { source: source, destination: destination, player: currentBoard.player };
        var _a = currentBoard.tryMove(move), success = _a.success, board = _a.board;
        if (success) {
            this.boards.push(board);
            this.lastMove = move;
            if (board.player == this.computerPlayer) {
                this.$timeout(this.doComputerPlayerMove.bind(this), 500);
            }
            return true;
        }
        else {
            return false;
        }
    };
    Checkers.prototype.getWinner = function () {
        var board = this.getCurrentBoard();
        return board.winner;
    };
    Checkers.prototype.doComputerPlayerMove = function () {
        this.searchResult = this.uctSearchService.search(this.getCurrentBoard(), this.computeOptions.maxIterations, this.computeOptions.maxTime);
        if (this.searchResult.move) {
            var move = this.searchResult.move;
            this.tryMove(move.source, move.destination);
        }
    };
    return Checkers;
}());
exports.Checkers = Checkers;
var CheckersProvider = (function () {
    function CheckersProvider() {
    }
    CheckersProvider.prototype.$get = function ($injector) {
        return $injector.instantiate(Checkers);
    };
    return CheckersProvider;
}());
exports.CheckersProvider = CheckersProvider;
