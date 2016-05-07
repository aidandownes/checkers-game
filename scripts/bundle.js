(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var checkers_module_1 = require('./checkers-module');
exports.AppModule = angular.module('app', [checkers_module_1.CheckersModule.name, 'ngMaterial']);
function configureThemes($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('deep-orange')
        .backgroundPalette('grey', {
        'default': '50'
    });
    $mdThemingProvider.theme('card-default')
        .backgroundPalette('grey');
    $mdThemingProvider.theme('card-blue-dark')
        .backgroundPalette('blue')
        .dark();
    $mdThemingProvider.theme('card-red')
        .backgroundPalette('red')
        .dark();
}
exports.AppModule.config(configureThemes);
var AppController = (function () {
    function AppController(checkers, $mdSidenav, $scope) {
        var _this = this;
        this.checkers = checkers;
        this.$mdSidenav = $mdSidenav;
        this.$scope = $scope;
        this.computeOptions = checkers.computeOptions;
        $scope.$watchCollection(function () { return _this.computeOptions; }, function (newValue, oldValue) {
            checkers.computeOptions = newValue;
            _this.isSettingsDirty = !!oldValue;
        });
        $scope.$watch(function () { return _this.isSidenavOpen; }, function (newValue, oldValue) {
            if (!newValue && oldValue && _this.isSettingsDirty) {
                _this.checkers.reset();
            }
            _this.isSettingsDirty = false;
        });
    }
    AppController.prototype.toggleMenu = function () {
        this.$mdSidenav('left').toggle();
    };
    AppController.prototype.restart = function () {
        this.checkers.reset();
    };
    return AppController;
}());
exports.AppModule.controller('AppController', AppController);

},{"./checkers-module":7}],2:[function(require,module,exports){
"use strict";
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assert failed');
    }
}
exports.assert = assert;
function assertNotEmpty(list, message) {
    if (!list || list.length == 0) {
        throw new Error(message || 'Assert failed: List not empty');
    }
}
exports.assertNotEmpty = assertNotEmpty;
function assertEmpty(list, message) {
    if (!list || list.length != 0) {
        throw new Error(message || 'Assert failed: List empty');
    }
}
exports.assertEmpty = assertEmpty;

},{}],3:[function(require,module,exports){
"use strict";
var game_model_1 = require('./game-model');
var Asserts = require('./assert');
var S = (function () {
    var squares = [];
    for (var i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();
var MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
var MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
var MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
var MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];
exports.SQUARE_COUNT = 32;
var Bitboard = (function () {
    function Bitboard(whitePieces, blackPieces, kings, player) {
        if (whitePieces === void 0) { whitePieces = 0xFFF00000; }
        if (blackPieces === void 0) { blackPieces = 0x00000FFF; }
        if (kings === void 0) { kings = 0; }
        if (player === void 0) { player = game_model_1.Player.One; }
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == game_model_1.Player.One) {
            var canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.Two;
        }
        else {
            var canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.One;
        }
        Asserts.assert((blackPieces & whitePieces) == 0);
    }
    Bitboard.prototype.doMove = function (move) {
        var result = this.tryMove(move);
        Asserts.assert(result.success, 'Move was not succesful');
        return result.board;
    };
    Bitboard.prototype.doRandomMove = function () {
        var moves = this.getMoves();
        Asserts.assertNotEmpty(moves);
        var randomMoveIndex = Math.floor(Math.random() * moves.length);
        return this.doMove(moves[randomMoveIndex]);
    };
    Bitboard.prototype.hasMoves = function () {
        return this.getMoves().length > 0;
    };
    Bitboard.prototype.getMoves = function () {
        if (!this.moves) {
            this.moves = [];
            var jumpers = (this.player == game_model_1.Player.One) ?
                this.getJumpersWhite() :
                this.getJumpersBlack();
            for (var i = 0; i < exports.SQUARE_COUNT; i++) {
                if (S[i] & jumpers) {
                    Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
                }
            }
            if (this.moves.length == 0) {
                var hoppers = (this.player == game_model_1.Player.One) ?
                    this.getHoppersWhite() :
                    this.getHoppersBlack();
                for (var i = 0; i < exports.SQUARE_COUNT; i++) {
                    if (S[i] & hoppers) {
                        Array.prototype.push.apply(this.moves, this.getHopMoves(i));
                    }
                }
            }
        }
        return this.moves;
    };
    Bitboard.prototype.getResult = function (player) {
        Asserts.assert(this.winner == game_model_1.Player.One || this.winner == game_model_1.Player.Two);
        return this.winner == player ? game_model_1.Result.Win : game_model_1.Result.Lose;
    };
    Bitboard.prototype.getPlayerToMove = function () {
        return this.player;
    };
    Bitboard.prototype.getOpponent = function (player) {
        switch (player) {
            case game_model_1.Player.One:
                return game_model_1.Player.Two;
            case game_model_1.Player.Two:
                return game_model_1.Player.One;
            default:
                return game_model_1.Player.None;
        }
    };
    Bitboard.prototype.getPlayerAtSquare = function (square) {
        var mask = S[square];
        if (this.whitePieces & mask) {
            return game_model_1.Player.One;
        }
        else if (this.blackPieces & mask) {
            return game_model_1.Player.Two;
        }
        else {
            return game_model_1.Player.None;
        }
    };
    Bitboard.prototype.isKing = function (square) {
        var mask = S[square];
        return !!(this.kings & mask);
    };
    Bitboard.prototype.getHopMoves = function (source) {
        var moves = [];
        var mask = S[source];
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var isKing = mask & this.kings;
        var player = this.player;
        var hops = 0;
        if (isKing || (player == game_model_1.Player.One)) {
            hops |= (mask >>> 4) & notOccupied;
            hops |= ((mask & MASK_R3) >>> 3) & notOccupied;
            hops |= ((mask & MASK_R5) >>> 5) & notOccupied;
        }
        if (isKing || (player == game_model_1.Player.Two)) {
            hops |= (mask << 4) & notOccupied;
            hops |= ((mask & MASK_L3) << 3) & notOccupied;
            hops |= ((mask & MASK_L5) << 5) & notOccupied;
        }
        for (var destination = 0; destination < 32; destination++) {
            if (S[destination] & hops) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    };
    Bitboard.prototype.rightJump = function (opponentPieces, notOccupied, mask) {
        var jumps = 0;
        var temp = (mask >>> 4) & opponentPieces;
        jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
        temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
        jumps |= (temp >>> 4) & notOccupied;
        return jumps;
    };
    Bitboard.prototype.leftJump = function (opponentPieces, notOccupied, mask) {
        var jumps = 0;
        var temp = (mask << 4) & opponentPieces;
        jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
        temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
        jumps |= (temp << 4) & notOccupied;
        return jumps;
    };
    Bitboard.prototype.getJumpMoves = function (source) {
        var moves = [];
        var mask = S[source];
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var isKing = mask & this.kings;
        var player = this.player;
        var jumps = 0;
        if (player == game_model_1.Player.One) {
            jumps |= this.rightJump(this.blackPieces, notOccupied, mask);
            if (isKing) {
                jumps |= this.leftJump(this.blackPieces, notOccupied, mask);
            }
        }
        else if (player == game_model_1.Player.Two) {
            jumps |= this.leftJump(this.whitePieces, notOccupied, mask);
            if (isKing) {
                jumps |= this.rightJump(this.whitePieces, notOccupied, mask);
            }
        }
        for (var destination = 0; destination < 32; destination++) {
            if (S[destination] & jumps) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    };
    Bitboard.prototype.getHoppersWhite = function () {
        if (this.player != game_model_1.Player.One) {
            return 0;
        }
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var kingPieces = this.whitePieces & this.kings;
        var movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >>> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >>> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >>> 5) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.getHoppersBlack = function () {
        if (this.player != game_model_1.Player.Two) {
            return 0;
        }
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var kingPieces = this.blackPieces & this.kings;
        var movers = (notOccupied >>> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >>> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >>> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied << 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.getJumpersWhite = function (whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        var notOccupied = ~(whitePieces | blackPieces);
        var kingPieces = whitePieces & kings;
        var movers = 0;
        var temp = (notOccupied << 4) & blackPieces;
        movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & whitePieces;
        temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & blackPieces;
        movers |= (temp << 4) & whitePieces;
        if (kingPieces) {
            temp = (notOccupied >>> 4) & blackPieces;
            movers |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & kingPieces;
            temp = (((notOccupied & MASK_R3) >>> 3) | ((notOccupied & MASK_R5) >>> 5)) & blackPieces;
            movers |= (temp >>> 4) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.getJumpersBlack = function (whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        var notOccupied = ~(whitePieces | blackPieces);
        var kingPieces = blackPieces & kings;
        var movers = 0;
        var temp = (notOccupied >>> 4) & whitePieces;
        movers |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & blackPieces;
        temp = (((notOccupied & MASK_R3) >>> 3) | ((notOccupied & MASK_R5) >>> 5)) & whitePieces;
        movers |= (temp >>> 4) & blackPieces;
        if (kingPieces) {
            temp = (notOccupied << 4) & whitePieces;
            movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & kingPieces;
            temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & whitePieces;
            movers |= (temp << 4) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.tryStep = function (source, destination) {
        var sourceMask = S[source];
        var destinationMask = S[destination];
        var isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            var canMove = (destinationMask << 4) & sourceMask;
            canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
            canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >>> 4) & sourceMask;
                canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
                canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            }
            if (canMove) {
                var whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                var blackPieces = this.blackPieces;
                var kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                var player = game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player = game_model_1.Player.Two) {
            var canMove = (destinationMask >>> 4) & sourceMask;
            canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
            canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            }
            if (canMove) {
                var whitePieces = this.whitePieces;
                var blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                var kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                var player = game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    };
    Bitboard.prototype.tryJump = function (source, destination) {
        var sourceMask = S[source];
        var destinationMask = S[destination];
        var isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            var canJump = void 0;
            var temp = (destinationMask << 4) & this.blackPieces;
            canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask >>> 4) & this.blackPieces;
                canJump = (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_R3) >>> 3) | ((destinationMask & MASK_R5) >>> 5)) & this.blackPieces;
                canJump = (temp >> 4) & sourceMask;
            }
            if (canJump) {
                var whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                var blackPieces = this.blackPieces ^ temp;
                var kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                var canJumpAgain = !(destinationMask & 0xF) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                var player = canJumpAgain ? game_model_1.Player.One : game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == game_model_1.Player.Two) {
            var canJump = void 0;
            var temp = (destinationMask >>> 4) & this.whitePieces;
            canJump = (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_R3) >>> 3) | ((destinationMask & MASK_R5) >>> 5)) & this.whitePieces;
                canJump = (temp >>> 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask << 4) & this.whitePieces;
                canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.whitePieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (canJump) {
                var whitePieces = this.whitePieces ^ temp;
                var blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                var kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                var canJumpAgain = !(destinationMask & 0xF0000000) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                var player = canJumpAgain ? game_model_1.Player.Two : game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    };
    Bitboard.prototype.tryMove = function (move) {
        var failureResult = { success: false };
        var sourceMask = S[move.source];
        var destinationMask = S[move.destination];
        var isKing = sourceMask & this.kings;
        if (this.winner != game_model_1.Player.None) {
            failureResult.message = 'Game is over';
            return failureResult;
        }
        if (this.player != this.getPlayerAtSquare(move.source)) {
            failureResult.message = 'Wrong player move';
            return failureResult;
        }
        if (this.getPlayerAtSquare(move.destination) != game_model_1.Player.None) {
            failureResult.message = 'Destination is not empty';
            return failureResult;
        }
        var jumpers = this.player == game_model_1.Player.One ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            var shouldJump = jumpers & sourceMask;
            if (shouldJump) {
                return this.tryJump(move.source, move.destination);
            }
            else {
                failureResult.message = 'Player should jump';
                return failureResult;
            }
        }
        return this.tryStep(move.source, move.destination);
    };
    Bitboard.prototype.toString = function () {
        var _this = this;
        var buffer = [];
        var prependSpace = false;
        var getPieceString = function (index) {
            var mask = S[index];
            var pieceString = '__';
            if (mask & _this.blackPieces) {
                pieceString = (mask & _this.kings) ? 'BK' : 'BP';
            }
            else if (mask & _this.whitePieces) {
                pieceString = (mask & _this.kings) ? 'WK' : 'WP';
            }
            return pieceString;
        };
        for (var i = 0; i < exports.SQUARE_COUNT; i += 4) {
            var lineBuffer = [];
            for (var j = i; j < i + 4; j++) {
                if (prependSpace) {
                    lineBuffer.push(' ');
                }
                lineBuffer.push(getPieceString(j));
                if (!prependSpace) {
                    lineBuffer.push(' ');
                }
            }
            lineBuffer.push('\n');
            prependSpace = !prependSpace;
            buffer.splice(0, 0, lineBuffer.join(' '));
        }
        return buffer.join(' ');
    };
    return Bitboard;
}());
exports.Bitboard = Bitboard;

},{"./assert":2,"./game-model":10}],4:[function(require,module,exports){
"use strict";
var checkers_bitboard_1 = require('./checkers-bitboard');
var game_model_1 = require('./game-model');
var collections_1 = require('./collections');
var ROW_LENGTH = 8;
var COLUMN_LENGTH = 8;
var DraggingClass = 'cb-dragging';
var DragClass = 'cb-drag';
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.add = function (other) {
        return new Point(this.x + other.x, this.y + other.y);
    };
    Point.prototype.subtract = function (other) {
        return new Point(this.x - other.x, this.y - other.y);
    };
    return Point;
}());
var BoardSquareArray = (function () {
    var squares = [];
    for (var i = 0; i < ROW_LENGTH; i++) {
        var mod2 = i % 2;
        for (var j = 7 - mod2; j > 0 - mod2; j -= 2) {
            squares.push({ row: i, column: j });
        }
    }
    return squares.reverse();
})();
function toPosition(square, squareSize) {
    var boardSquare = BoardSquareArray[square];
    var x = boardSquare.column * squareSize;
    var y = boardSquare.row * squareSize;
    return new Point(x, y);
}
function toSquare(position, squareSize) {
    var row = Math.floor(position.y / squareSize);
    var column = Math.floor(position.x / squareSize);
    return collections_1.Arrays.findIndex(BoardSquareArray, function (bs) { return bs.column == column && bs.row == row; });
}
var CheckersBoardController = (function () {
    function CheckersBoardController(checkers, $element, $window, $timeout, $log, $scope, $q) {
        var _this = this;
        this.checkers = checkers;
        this.$element = $element;
        this.$window = $window;
        this.$timeout = $timeout;
        this.$log = $log;
        this.$scope = $scope;
        this.$q = $q;
        this.canvasElement = $element[0].querySelector('canvas');
        this.canvas = angular.element(this.canvasElement);
        this.ctx = this.canvasElement.getContext('2d');
        this.canvas.on('mousedown', this.handleMouseDown.bind(this));
        this.canvas.on('mousemove', this.handleMouseMove.bind(this));
        $scope.$watch(function () { return _this.$element.width(); }, this.resize.bind(this));
        $scope.$watch(function () { return _this.checkers.getCurrentBoard(); }, this.onBoardUpdated.bind(this));
    }
    CheckersBoardController.prototype.$postLink = function () {
        this.spritesPromise = this.loadImage(this.spritesImageUrl);
        this.render();
    };
    CheckersBoardController.prototype.onBoardUpdated = function (board) {
        this.playableSquares = this.checkers.getPlayablePieces();
        this.render();
    };
    CheckersBoardController.prototype.loadImage = function (src) {
        var defer = this.$q.defer();
        var img = new Image();
        img.src = src;
        img.onload = function (ev) {
            defer.resolve(img);
        };
        return defer.promise;
    };
    CheckersBoardController.prototype.render = function () {
        var _this = this;
        this.spritesPromise.then(function () {
            _this.drawBoard();
            _this.drawPieces(_this.checkers.getCurrentBoard());
        });
    };
    CheckersBoardController.prototype.resize = function () {
        var width = this.$element.width();
        var height = this.$element.height();
        if (width > height) {
            this.size = height;
        }
        else {
            this.size = width;
        }
        this.squareSize = this.size / ROW_LENGTH;
        this.canvasElement.width = this.size;
        this.canvasElement.height = this.size;
        this.render();
    };
    CheckersBoardController.prototype.handleMouseDown = function (ev) {
        var p = this.getMousePoint(ev);
        var sourceSquare = toSquare(p, this.squareSize);
        var player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            var squarePosition = toPosition(sourceSquare, this.squareSize);
            this.isDragging = true;
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = p.subtract(squarePosition);
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addClass(DraggingClass);
            this.canvas.removeClass(DragClass);
            this.render();
        }
    };
    CheckersBoardController.prototype.handleMouseMove = function (ev) {
        var p = this.getMousePoint(ev);
        if (this.isDragging) {
            this.dragPosition = p;
            this.render();
        }
        else {
            var sourceSquare = toSquare(p, this.squareSize);
            if (this.playableSquares.indexOf(sourceSquare) < 0) {
                this.canvas.removeClass(DragClass);
            }
            else {
                this.canvas.addClass(DragClass);
            }
        }
    };
    CheckersBoardController.prototype.handleMouseUp = function (ev) {
        var p = this.getMousePoint(ev);
        var destinationSquare = toSquare(p, this.squareSize);
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        this.isDragging = false;
        this.dragTarget = -1;
        this.dragPosition = null;
        this.canvas.off('mouseup');
        this.canvas.removeClass(DraggingClass);
        this.render();
    };
    CheckersBoardController.prototype.getMousePoint = function (ev) {
        var rect = this.canvas[0].getBoundingClientRect();
        return new Point(ev.clientX - rect.left, ev.clientY - rect.top);
    };
    CheckersBoardController.prototype.drawPiece = function (point, player, isKing, translation) {
        var _this = this;
        this.spritesPromise.then(function (img) {
            var sourceX = isKing ? (2 * _this.spriteSize) : 0;
            if (player == game_model_1.Player.One) {
                sourceX += _this.spriteSize;
            }
            var spriteAdjust = new Point(2, 2);
            var drawPoint = point.add(spriteAdjust);
            if (translation) {
                drawPoint = drawPoint.subtract(translation);
            }
            _this.ctx.drawImage(img, sourceX, 0, _this.spriteSize, _this.spriteSize, drawPoint.x, drawPoint.y, _this.squareSize, _this.squareSize);
        });
    };
    CheckersBoardController.prototype.drawPieces = function (bitboard) {
        var drawDragTarget;
        for (var i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            var player = bitboard.getPlayerAtSquare(i);
            if (player == game_model_1.Player.None) {
                continue;
            }
            var isKing = bitboard.isKing(i);
            if (i == this.dragTarget) {
                drawDragTarget = this.drawPiece.bind(this, this.dragPosition, player, isKing, this.dragTranslation);
            }
            else {
                var position = toPosition(i, this.squareSize);
                this.drawPiece(position, player, isKing);
            }
        }
        if (drawDragTarget) {
            drawDragTarget();
        }
    };
    CheckersBoardController.prototype.drawSquare = function (square) {
        var position = toPosition(square, this.squareSize);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(position.x, position.y, this.squareSize, this.squareSize);
    };
    CheckersBoardController.prototype.highlightSquare = function (square) {
        var position = toPosition(square, this.squareSize);
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(position.x, position.y, this.squareSize, this.squareSize);
    };
    CheckersBoardController.prototype.drawBoard = function () {
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        for (var i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            this.drawSquare(i);
        }
        var lastMove = this.checkers.lastMove;
        if (lastMove) {
            this.highlightSquare(lastMove.source);
            this.highlightSquare(lastMove.destination);
        }
    };
    return CheckersBoardController;
}());
exports.CheckersBoard = {
    template: "<canvas>\n        <span id=\"no_html5\">Your Browser Does Not Support HTML5's Canvas Feature.</span>\n    </canvas>",
    bindings: {
        spritesImageUrl: '@',
        spriteSize: '<'
    },
    controller: CheckersBoardController
};

},{"./checkers-bitboard":3,"./collections":9,"./game-model":10}],5:[function(require,module,exports){
"use strict";
var game_model_1 = require('./game-model');
var GameStatsController = (function () {
    function GameStatsController(checkers, $interval) {
        var _this = this;
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(function () {
            var endTime = new Date();
            _this.playTime = (endTime.getTime() - _this.checkers.startTime) / 1000;
        }, 1000);
    }
    GameStatsController.prototype.getCurrentPlayer = function () {
        switch (this.checkers.getCurrentPlayer()) {
            case game_model_1.Player.One:
                return 'White';
            case game_model_1.Player.Two:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    };
    GameStatsController.prototype.undoMove = function () {
        return false;
    };
    GameStatsController.prototype.getPlayTime = function () {
        return this.playTime;
    };
    return GameStatsController;
}());
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        var seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        var minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        var hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        var days = value;
        if (days) {
            return days + " days, " + hours + " hrs, " + minutes + " mins, " + seconds + " secs";
        }
        else if (hours) {
            return hours + " hrs, " + minutes + " mins, " + seconds + " secs";
        }
        else if (minutes) {
            return minutes == 1 ? minutes + " mins, " + seconds + " secs" : minutes + " mins, " + seconds + " secs";
        }
        else {
            return seconds + " secs";
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameStats = {
    templateUrl: 'templates/game-stats.ng',
    controller: GameStatsController
};

},{"./game-model":10}],6:[function(require,module,exports){
"use strict";
var MctsStatsController = (function () {
    function MctsStatsController(checkers, $scope) {
        var _this = this;
        this.checkers = checkers;
        this.$scope = $scope;
        $scope.$watch(function () { return checkers.searchResult; }, function (searchResult) {
            _this.searchResult = searchResult;
        });
    }
    MctsStatsController.prototype.getWinPercentage = function () {
        return this.searchResult ?
            (1 - this.searchResult.winProbabilty) * 100 :
            50;
    };
    MctsStatsController.prototype.getTime = function () {
        return this.searchResult ?
            this.searchResult.time : 0;
    };
    MctsStatsController.prototype.getIterations = function () {
        return this.searchResult ?
            this.searchResult.iterations : 0;
    };
    return MctsStatsController;
}());
exports.CheckersMctsStats = {
    templateUrl: 'templates/mcts-stats.ng',
    controller: MctsStatsController
};

},{}],7:[function(require,module,exports){
"use strict";
var checkers_service_1 = require('./checkers-service');
var checkers_board_1 = require('./checkers-board');
var checkers_game_stats_1 = require('./checkers-game-stats');
var checkers_mcts_stats_1 = require('./checkers-mcts-stats');
var uct_1 = require('./uct');
exports.CheckersModule = angular.module('Checkers', [uct_1.UctSearchModule.name]);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
exports.CheckersModule.component('checkersGameStats', checkers_game_stats_1.CheckersGameStats);
exports.CheckersModule.component('checkersMctsStats', checkers_mcts_stats_1.CheckersMctsStats);
exports.CheckersModule.filter('timeFilter', checkers_game_stats_1.TimeFormatFilter);

},{"./checkers-board":4,"./checkers-game-stats":5,"./checkers-mcts-stats":6,"./checkers-service":8,"./uct":11}],8:[function(require,module,exports){
"use strict";
var checkers_bitboard_1 = require('./checkers-bitboard');
var game_model_1 = require('./game-model');
var uct_1 = require('./uct');
exports.UctSearchService = uct_1.UctSearchService;
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

},{"./checkers-bitboard":3,"./game-model":10,"./uct":11}],9:[function(require,module,exports){
"use strict";
var Arrays = (function () {
    function Arrays() {
    }
    Arrays.max = function (arr, compare) {
        var len = arr.length;
        var max;
        while (len--) {
            if (max == undefined) {
                max = arr[len];
            }
            else if (compare(arr[len], max)) {
                max = arr[len];
            }
        }
        return max;
    };
    Arrays.findIndex = function (arr, predicate) {
        for (var i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) {
                return i;
            }
        }
        return -1;
    };
    return Arrays;
}());
exports.Arrays = Arrays;
var ListNode = (function () {
    function ListNode(data, next) {
        this.data = data;
        this.next = next;
    }
    return ListNode;
}());
var List = (function () {
    function List(iterable) {
        var _this = this;
        this.size = 0;
        if (iterable) {
            iterable.forEach(function (t) { return _this.add(t); });
        }
    }
    List.prototype.add = function (data) {
        if (!this.start) {
            this.start = new ListNode(data);
            this.end = this.start;
        }
        else {
            this.end.next = new ListNode(data);
            this.end = this.end.next;
        }
        this.size++;
    };
    List.prototype.delete = function (data) {
        var current = this.start;
        var previous = this.start;
        while (current) {
            if (data === current.data) {
                this.size--;
                if (current === this.start) {
                    this.start = current.next;
                    return;
                }
                if (current === this.end) {
                    this.end = previous;
                }
                previous.next = current.next;
                return;
            }
            previous = current;
            current = current.next;
        }
    };
    List.prototype.item = function (index) {
        var current = this.start;
        while (current) {
            if (index === 0) {
                return current.data;
            }
            current = current.next;
            index--;
        }
    };
    List.prototype.forEach = function (f) {
        var current = this.start;
        while (current) {
            f(current.data);
            current = current.next;
        }
    };
    List.prototype.getSize = function () {
        return this.size;
    };
    return List;
}());
exports.List = List;

},{}],10:[function(require,module,exports){
"use strict";
(function (Player) {
    Player[Player["None"] = 0] = "None";
    Player[Player["One"] = 1] = "One";
    Player[Player["Two"] = 2] = "Two";
})(exports.Player || (exports.Player = {}));
var Player = exports.Player;
(function (Result) {
    Result[Result["Win"] = 0] = "Win";
    Result[Result["Lose"] = 1] = "Lose";
    Result[Result["Draw"] = 2] = "Draw";
})(exports.Result || (exports.Result = {}));
var Result = exports.Result;

},{}],11:[function(require,module,exports){
"use strict";
var asserts = require('./assert');
var game_model_1 = require('./game-model');
var collections_1 = require('./collections');
var C = 1.44;
function getRandomInteger(upperBounds) {
    return Math.floor(Math.random() * upperBounds);
}
var Node = (function () {
    function Node(parent, state, move) {
        this.parent = parent;
        this.state = state;
        this.move = move;
        this.children = [];
        this.wins = 0;
        this.visits = 0;
        this.uctScore = 0;
        this.confidence = 0;
        this.validMoves = new collections_1.List(state.getMoves());
        this.isTerminal = this.validMoves.getSize() == 0;
    }
    Node.prototype.isfullyExpanded = function () {
        return this.validMoves.getSize() == 0;
    };
    Node.prototype.getUntriedMove = function () {
        var index = getRandomInteger(this.validMoves.getSize());
        var move = this.validMoves.item(index);
        this.validMoves.delete(move);
        return move;
    };
    Node.prototype.addChild = function (child) {
        this.children.push(child);
    };
    return Node;
}());
var UctSearchService = (function () {
    function UctSearchService() {
    }
    UctSearchService.prototype.search = function (rootState, maxIterations, maxTime) {
        if (maxIterations === void 0) { maxIterations = 1000; }
        if (maxTime === void 0) { maxTime = 1000; }
        var root = new Node(null, rootState);
        var startTime = Date.now();
        var i;
        for (i = 0; i < maxIterations; i++) {
            var current = this.treePolicy(root, rootState);
            var reward = this.defaultPolicy(current.state);
            this.backup(current, reward);
            if (Date.now() - startTime > maxTime) {
                break;
            }
        }
        var bestChild = this.bestChild(root, 0);
        return {
            move: bestChild.move,
            winProbabilty: (bestChild.wins / bestChild.visits),
            time: Date.now() - startTime,
            iterations: i
        };
    };
    UctSearchService.prototype.treePolicy = function (node, state) {
        while (!node.isTerminal) {
            if (!node.isfullyExpanded()) {
                return this.expand(node);
            }
            else {
                return this.bestChild(node, C);
            }
        }
    };
    UctSearchService.prototype.expand = function (node) {
        var a = node.getUntriedMove();
        var newState = node.state.doMove(a);
        var newNode = new Node(node, newState, a);
        node.addChild(newNode);
        return newNode;
    };
    UctSearchService.prototype.defaultPolicy = function (state) {
        var moves = state.getMoves();
        while (moves.length > 0) {
            var index = getRandomInteger(moves.length);
            var move = moves[index];
            state = state.doMove(move);
            moves = state.getMoves();
        }
        asserts.assert(!state.hasMoves());
        return function (node, player) {
            var result = state.getResult(player);
            switch (result) {
                case game_model_1.Result.Draw:
                    return 0.5;
                case game_model_1.Result.Win:
                    return 1;
                default:
                    return 0;
            }
        };
    };
    UctSearchService.prototype.backup = function (node, reward) {
        while (node) {
            var player = node.state.getOpponent(node.state.getPlayerToMove());
            node.visits++;
            node.wins += reward(node, player);
            node = node.parent;
        }
    };
    UctSearchService.prototype.bestChild = function (node, c) {
        node.children.forEach(function (child) {
            child.confidence = c * Math.sqrt(2 * Math.log(node.visits) / child.visits);
            child.uctScore = (child.wins / child.visits) + child.confidence;
        });
        return collections_1.Arrays.max(node.children, function (a, b) { return a.uctScore > b.uctScore; });
    };
    return UctSearchService;
}());
exports.UctSearchService = UctSearchService;
exports.UctSearchModule = angular.module('UctSearchModule', [])
    .service('uctSearchService', UctSearchService);

},{"./assert":2,"./collections":9,"./game-model":10}]},{},[1,2,3,4,5,6,7,8,9,10,11])


//# sourceMappingURL=bundle.js.map
