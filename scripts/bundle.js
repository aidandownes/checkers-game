(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const checkers_module_1 = require('./checkers-module');
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
class AppController {
    constructor(checkers, $mdSidenav, $scope) {
        this.checkers = checkers;
        this.$mdSidenav = $mdSidenav;
        this.$scope = $scope;
        this.computeOptions = checkers.computeOptions;
        $scope.$watchCollection(() => this.computeOptions, (newValue, oldValue) => {
            checkers.computeOptions = newValue;
            this.isSettingsDirty = !!oldValue;
        });
        $scope.$watch(() => this.isSidenavOpen, (newValue, oldValue) => {
            if (!newValue && oldValue && this.isSettingsDirty) {
                this.checkers.reset();
            }
            this.isSettingsDirty = false;
        });
    }
    toggleMenu() {
        this.$mdSidenav('left').toggle();
    }
    restart() {
        this.checkers.reset();
    }
}
exports.AppModule.controller('AppController', AppController);

},{"./checkers-module":8}],2:[function(require,module,exports){
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
const game_model_1 = require('./game-model');
const Asserts = require('./assert');
const S = (function () {
    let squares = [];
    for (let i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();
const MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
const MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
const MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
const MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];
exports.SQUARE_COUNT = 32;
class Bitboard {
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = game_model_1.Player.One) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == game_model_1.Player.One) {
            let canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.Two;
        }
        else {
            let canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.One;
        }
        Asserts.assert((blackPieces & whitePieces) == 0);
    }
    doMove(move) {
        let result = this.tryMove(move);
        Asserts.assert(result.success, 'Move was not succesful');
        return result.board;
    }
    doRandomMove() {
        let moves = this.getMoves();
        Asserts.assertNotEmpty(moves);
        let randomMoveIndex = Math.floor(Math.random() * moves.length);
        return this.doMove(moves[randomMoveIndex]);
    }
    hasMoves() {
        return this.getMoves().length > 0;
    }
    getMoves() {
        if (!this.moves) {
            this.moves = [];
            let jumpers = (this.player == game_model_1.Player.One) ?
                this.getJumpersWhite() :
                this.getJumpersBlack();
            for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                if (S[i] & jumpers) {
                    Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
                }
            }
            if (this.moves.length == 0) {
                let hoppers = (this.player == game_model_1.Player.One) ?
                    this.getHoppersWhite() :
                    this.getHoppersBlack();
                for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                    if (S[i] & hoppers) {
                        Array.prototype.push.apply(this.moves, this.getHopMoves(i));
                    }
                }
            }
        }
        return this.moves;
    }
    getResult(player) {
        Asserts.assert(this.winner == game_model_1.Player.One || this.winner == game_model_1.Player.Two);
        return this.winner == player ? game_model_1.Result.Win : game_model_1.Result.Lose;
    }
    getPlayerToMove() {
        return this.player;
    }
    getOpponent(player) {
        switch (player) {
            case game_model_1.Player.One:
                return game_model_1.Player.Two;
            case game_model_1.Player.Two:
                return game_model_1.Player.One;
            default:
                return game_model_1.Player.None;
        }
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return game_model_1.Player.One;
        }
        else if (this.blackPieces & mask) {
            return game_model_1.Player.Two;
        }
        else {
            return game_model_1.Player.None;
        }
    }
    isKing(square) {
        const mask = S[square];
        return !!(this.kings & mask);
    }
    getHopMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
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
        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & hops) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    }
    rightJump(opponentPieces, notOccupied, mask) {
        var jumps = 0;
        let temp = (mask >>> 4) & opponentPieces;
        jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
        temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
        jumps |= (temp >>> 4) & notOccupied;
        return jumps;
    }
    leftJump(opponentPieces, notOccupied, mask) {
        var jumps = 0;
        let temp = (mask << 4) & opponentPieces;
        jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
        temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
        jumps |= (temp << 4) & notOccupied;
        return jumps;
    }
    getJumpMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
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
        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & jumps) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    }
    getHoppersWhite() {
        if (this.player != game_model_1.Player.One) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        var movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >>> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >>> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >>> 5) & kingPieces;
        }
        return movers;
    }
    getHoppersBlack() {
        if (this.player != game_model_1.Player.Two) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        var movers = (notOccupied >>> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >>> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >>> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied << 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    }
    getJumpersWhite(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = whitePieces & kings;
        var movers = 0;
        let temp = (notOccupied << 4) & blackPieces;
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
    }
    getJumpersBlack(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = blackPieces & kings;
        var movers = 0;
        let temp = (notOccupied >>> 4) & whitePieces;
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
    }
    tryStep(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
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
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces;
                let kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                let player = game_model_1.Player.Two;
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
                let whitePieces = this.whitePieces;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                let player = game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryJump(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            let canJump;
            let temp = (destinationMask << 4) & this.blackPieces;
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
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces ^ temp;
                let kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                let canJumpAgain = !(destinationMask & 0xF) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? game_model_1.Player.One : game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == game_model_1.Player.Two) {
            let canJump;
            let temp = (destinationMask >>> 4) & this.whitePieces;
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
                let whitePieces = this.whitePieces ^ temp;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                let canJumpAgain = !(destinationMask & 0xF0000000) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? game_model_1.Player.Two : game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryMove(move) {
        const failureResult = { success: false };
        const sourceMask = S[move.source];
        const destinationMask = S[move.destination];
        const isKing = sourceMask & this.kings;
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
        let jumpers = this.player == game_model_1.Player.One ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            let shouldJump = jumpers & sourceMask;
            if (shouldJump) {
                return this.tryJump(move.source, move.destination);
            }
            else {
                failureResult.message = 'Player should jump';
                return failureResult;
            }
        }
        return this.tryStep(move.source, move.destination);
    }
    toString() {
        let buffer = [];
        let prependSpace = false;
        let getPieceString = (index) => {
            let mask = S[index];
            let pieceString = '__';
            if (mask & this.blackPieces) {
                pieceString = (mask & this.kings) ? 'BK' : 'BP';
            }
            else if (mask & this.whitePieces) {
                pieceString = (mask & this.kings) ? 'WK' : 'WP';
            }
            return pieceString;
        };
        for (let i = 0; i < exports.SQUARE_COUNT; i += 4) {
            let lineBuffer = [];
            for (let j = i; j < i + 4; j++) {
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
    }
}
exports.Bitboard = Bitboard;

},{"./assert":2,"./game-model":11}],4:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const game_model_1 = require('./game-model');
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;
const DraggingClass = 'cb-dragging';
const DragClass = 'cb-drag';
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }
    subtract(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }
}
const BoardSquareArray = (function () {
    let squares = [];
    for (let i = 0; i < ROW_LENGTH; i++) {
        let mod2 = i % 2;
        for (let j = 7 - mod2; j > 0 - mod2; j -= 2) {
            squares.push({ row: i, column: j });
        }
    }
    return squares.reverse();
})();
function toPosition(square, squareSize) {
    let boardSquare = BoardSquareArray[square];
    let x = boardSquare.column * squareSize;
    let y = boardSquare.row * squareSize;
    return new Point(x, y);
}
function toSquare(position, squareSize) {
    var row = Math.floor(position.y / squareSize);
    var column = Math.floor(position.x / squareSize);
    return BoardSquareArray.findIndex(bs => bs.column == column && bs.row == row);
}
class CheckersBoardController {
    constructor(checkers, $element, $window, $timeout, $log, $scope, $q) {
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
        $scope.$watch(() => this.$element.width(), this.resize.bind(this));
        $scope.$watch(() => this.checkers.currentBoard, this.onBoardUpdated.bind(this));
    }
    $postLink() {
        this.spritesPromise = this.loadImage(this.spritesImageUrl);
        this.render();
    }
    onBoardUpdated(board) {
        this.playableSquares = this.checkers.playablePieces;
        this.render();
    }
    loadImage(src) {
        let defer = this.$q.defer();
        let img = new Image();
        img.src = src;
        img.onload = (ev) => {
            defer.resolve(img);
        };
        return defer.promise;
    }
    render() {
        this.spritesPromise.then(() => {
            this.drawBoard();
            this.drawPieces(this.checkers.currentBoard);
        });
    }
    resize() {
        const width = this.$element.width();
        const height = this.$element.height();
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
    }
    handleMouseDown(ev) {
        let p = this.getMousePoint(ev);
        let sourceSquare = toSquare(p, this.squareSize);
        let player = this.checkers.currentBoard.getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.currentBoard.player) {
            let squarePosition = toPosition(sourceSquare, this.squareSize);
            this.isDragging = true;
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = p.subtract(squarePosition);
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addClass(DraggingClass);
            this.canvas.removeClass(DragClass);
            this.render();
        }
    }
    handleMouseMove(ev) {
        let p = this.getMousePoint(ev);
        if (this.isDragging) {
            this.dragPosition = p;
            this.render();
        }
        else {
            let sourceSquare = toSquare(p, this.squareSize);
            if (this.playableSquares.indexOf(sourceSquare) < 0) {
                this.canvas.removeClass(DragClass);
            }
            else {
                this.canvas.addClass(DragClass);
            }
        }
    }
    handleMouseUp(ev) {
        let p = this.getMousePoint(ev);
        let destinationSquare = toSquare(p, this.squareSize);
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        this.isDragging = false;
        this.dragTarget = -1;
        this.dragPosition = null;
        this.canvas.off('mouseup');
        this.canvas.removeClass(DraggingClass);
        this.render();
    }
    getMousePoint(ev) {
        let rect = this.canvas[0].getBoundingClientRect();
        return new Point(ev.clientX - rect.left, ev.clientY - rect.top);
    }
    drawPiece(point, player, isKing, translation) {
        this.spritesPromise.then(img => {
            let sourceX = isKing ? (2 * this.spriteSize) : 0;
            if (player == game_model_1.Player.One) {
                sourceX += this.spriteSize;
            }
            let spriteAdjust = new Point(2, 2);
            let drawPoint = point.add(spriteAdjust);
            if (translation) {
                drawPoint = drawPoint.subtract(translation);
            }
            this.ctx.drawImage(img, sourceX, 0, this.spriteSize, this.spriteSize, drawPoint.x, drawPoint.y, this.squareSize, this.squareSize);
        });
    }
    drawPieces(bitboard) {
        let drawDragTarget;
        for (let i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            let player = bitboard.getPlayerAtSquare(i);
            if (player == game_model_1.Player.None) {
                continue;
            }
            let isKing = bitboard.isKing(i);
            if (i == this.dragTarget) {
                drawDragTarget = this.drawPiece.bind(this, this.dragPosition, player, isKing, this.dragTranslation);
            }
            else {
                let position = toPosition(i, this.squareSize);
                this.drawPiece(position, player, isKing);
            }
        }
        if (drawDragTarget) {
            drawDragTarget();
        }
    }
    drawSquare(square) {
        let position = toPosition(square, this.squareSize);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(position.x, position.y, this.squareSize, this.squareSize);
    }
    highlightSquare(square) {
        let position = toPosition(square, this.squareSize);
        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(position.x, position.y, this.squareSize, this.squareSize);
    }
    drawBoard() {
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        for (let i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            this.drawSquare(i);
        }
        let lastMove = this.checkers.lastMove;
        if (lastMove) {
            this.highlightSquare(lastMove.source);
            this.highlightSquare(lastMove.destination);
        }
    }
}
exports.CheckersBoard = {
    template: `<canvas>
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        spritesImageUrl: '@',
        spriteSize: '<'
    },
    controller: CheckersBoardController
};

},{"./checkers-bitboard":3,"./game-model":11}],5:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
class GameMenuController {
    constructor(checkers, $interval) {
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(() => {
            let endTime = new Date();
            this.playTime = (endTime.getTime() - this.checkers.getStartTime()) / 1000;
        }, 1000);
    }
    getCurrentPlayer() {
        switch (this.checkers.getCurrentPlayer()) {
            case checkers_service_1.Player.White:
                return 'White';
            case checkers_service_1.Player.Black:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }
    undoMove() {
        return false;
    }
    getPlayTime() {
        return this.playTime;
    }
}
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        let seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        let minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        let hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        let days = value;
        if (days) {
            return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (hours) {
            return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (minutes) {
            return minutes == 1 ? `${minutes} mins, ${seconds} secs` : `${minutes} mins, ${seconds} secs`;
        }
        else {
            return `${seconds} secs`;
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameMenu = {
    templateUrl: './templates/game-menu.html',
    controller: GameMenuController
};

},{"./checkers-service":9}],6:[function(require,module,exports){
"use strict";
const game_model_1 = require('./game-model');
class GameStatsController {
    constructor(checkers, $interval) {
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(() => {
            let endTime = new Date();
            this.playTime = (endTime.getTime() - this.checkers.startTime) / 1000;
        }, 1000);
    }
    getCurrentPlayer() {
        switch (this.checkers.currentPlayer) {
            case game_model_1.Player.One:
                return 'White';
            case game_model_1.Player.Two:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }
    undoMove() {
        return false;
    }
    getPlayTime() {
        return this.playTime;
    }
}
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        let seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        let minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        let hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        let days = value;
        if (days) {
            return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (hours) {
            return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (minutes) {
            return minutes == 1 ? `${minutes} mins, ${seconds} secs` : `${minutes} mins, ${seconds} secs`;
        }
        else {
            return `${seconds} secs`;
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameStats = {
    templateUrl: './templates/game-stats.ng',
    controller: GameStatsController
};

},{"./game-model":11}],7:[function(require,module,exports){
"use strict";
class MctsStatsController {
    constructor(checkers, $scope) {
        this.checkers = checkers;
        this.$scope = $scope;
        $scope.$watch(() => checkers.searchResult, (searchResult) => {
            this.searchResult = searchResult;
        });
    }
    getWinPercentage() {
        return this.searchResult ?
            (1 - this.searchResult.winProbabilty) * 100 :
            50;
    }
    getTime() {
        return this.searchResult ?
            this.searchResult.time : 0;
    }
    getIterations() {
        return this.searchResult ?
            this.searchResult.iterations : 0;
    }
}
exports.CheckersMctsStats = {
    templateUrl: './templates/mcts-stats.ng',
    controller: MctsStatsController
};

},{}],8:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
const checkers_game_stats_1 = require('./checkers-game-stats');
const checkers_mcts_stats_1 = require('./checkers-mcts-stats');
const uct_1 = require('./uct');
exports.CheckersModule = angular.module('Checkers', [uct_1.UctSearchModule.name]);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
exports.CheckersModule.component('checkersGameStats', checkers_game_stats_1.CheckersGameStats);
exports.CheckersModule.component('checkersMctsStats', checkers_mcts_stats_1.CheckersMctsStats);
exports.CheckersModule.filter('timeFilter', checkers_game_stats_1.TimeFormatFilter);

},{"./checkers-board":4,"./checkers-game-stats":6,"./checkers-mcts-stats":7,"./checkers-service":9,"./uct":13}],9:[function(require,module,exports){
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
        this.computerPlayer = game_model_1.Player.Two;
        this.humanPlayer = game_model_1.Player.One;
        this.computeOptions = {
            maxIterations: DEFAULT_MAX_ITERATIONS,
            maxTime: DEFAULT_MAX_TIME_MS
        };
        this.reset();
    }
    reset() {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
        this.searchResult = null;
    }
    get currentPlayer() {
        return this.currentBoard.player;
    }
    get currentBoard() {
        return this.boards[this.boards.length - 1];
    }
    get playablePieces() {
        if (this.currentPlayer != this.humanPlayer) {
            return [];
        }
        return this.currentBoard.getMoves().map(m => m.source);
    }
    getOpponent(player) {
        if (player == game_model_1.Player.None)
            return game_model_1.Player.None;
        return player == game_model_1.Player.One ? game_model_1.Player.Two : game_model_1.Player.One;
    }
    tryMove(source, destination) {
        let currentBoard = this.currentBoard;
        let move = { source: source, destination: destination, player: currentBoard.player };
        let { success, board } = currentBoard.tryMove(move);
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
    }
    doComputerPlayerMove() {
        this.searchResult = this.uctSearchService.search(this.currentBoard, this.computeOptions.maxIterations, this.computeOptions.maxTime);
        if (this.searchResult.move) {
            let move = this.searchResult.move;
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

},{"./checkers-bitboard":3,"./game-model":11,"./uct":13}],10:[function(require,module,exports){
"use strict";
class Arrays {
    static max(arr, compare) {
        let len = arr.length;
        let max;
        while (len--) {
            if (max == undefined) {
                max = arr[len];
            }
            else if (compare(arr[len], max)) {
                max = arr[len];
            }
        }
        return max;
    }
}
exports.Arrays = Arrays;
class ListNode {
    constructor(data, next) {
        this.data = data;
        this.next = next;
    }
}
class List {
    constructor(iterable) {
        this.size = 0;
        if (iterable) {
            iterable.forEach((t) => this.add(t));
        }
    }
    add(data) {
        if (!this.start) {
            this.start = new ListNode(data);
            this.end = this.start;
        }
        else {
            this.end.next = new ListNode(data);
            this.end = this.end.next;
        }
        this.size++;
    }
    delete(data) {
        let current = this.start;
        let previous = this.start;
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
    }
    item(index) {
        let current = this.start;
        while (current) {
            if (index === 0) {
                return current.data;
            }
            current = current.next;
            index--;
        }
    }
    forEach(f) {
        let current = this.start;
        while (current) {
            f(current.data);
            current = current.next;
        }
    }
    getSize() {
        return this.size;
    }
}
exports.List = List;

},{}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
"use strict";
const asserts = require('./assert');
const game_model_1 = require('./game-model');
class ComputeOptions {
    constructor(maxIterations = 10000, maxTime = -1, verbose = false) {
        this.maxIterations = maxIterations;
        this.maxTime = maxTime;
        this.verbose = verbose;
    }
}
exports.ComputeOptions = ComputeOptions;
class Node {
    constructor(state, move, parent) {
        this.state = state;
        this.move = move;
        this.parent = parent;
        this.playerToMove = state.getPlayerToMove();
        this.wins = 0;
        this.visits = 0;
        this.moves = state.getMoves();
        this.uctScore = 0;
        this.children = [];
    }
    hasUntriedMoves() {
        return this.moves.length > 0;
    }
    getUntriedMove() {
        asserts.assertNotEmpty(this.moves);
        let index = Math.floor(Math.random() * this.moves.length);
        return this.moves[index];
    }
    getBestChild() {
        asserts.assertEmpty(this.moves);
        asserts.assertNotEmpty(this.children);
        return this.children.reduce((pv, cv) => pv.visits > cv.visits ? pv : cv);
    }
    selectChildViaUctScore() {
        for (let child of this.children) {
            let winRatio = child.wins / child.visits;
            let confidence = Math.sqrt(2 * Math.log(this.visits) / child.visits);
            child.uctScore = winRatio + confidence;
        }
        return this.children.reduce((pv, cv) => pv.uctScore > cv.uctScore ? pv : cv);
    }
    addChild(move, state) {
        let newChild = new Node(state, move, this);
        this.children.push(newChild);
        let index = this.moves.indexOf(move);
        this.moves.splice(index, 1);
        return newChild;
    }
    update(result) {
        switch (result) {
            case game_model_1.Result.Draw:
                this.wins += 0.5;
                break;
            case game_model_1.Result.Win:
                this.wins++;
            default:
                break;
        }
        this.visits++;
    }
    hasChildren() {
        return this.children.length > 0;
    }
}
function computeTree(rootState, options) {
    asserts.assert(options.maxIterations >= 0 || options.maxTime >= 0);
    const root = new Node(rootState);
    const startTime = new Date();
    for (let i = 0; i < options.maxIterations || options.maxTime < 0; i++) {
        let node = root;
        let state = rootState;
        while (!node.hasUntriedMoves() && node.hasChildren()) {
            node = node.selectChildViaUctScore();
            state = state.doMove(node.move);
        }
        if (node.hasUntriedMoves()) {
            let move = node.getUntriedMove();
            state = state.doMove(move);
            node = node.addChild(move, state);
        }
        while (state.hasMoves()) {
            state = state.doRandomMove();
        }
        while (node) {
            node.update(state.getResult(node.playerToMove));
            node = node.parent;
        }
        if (options.maxTime > 0) {
            let elapsedTime = (new Date().getTime()) - startTime.getTime();
            if (elapsedTime >= options.maxTime) {
                break;
            }
        }
    }
    return root;
}
function computeMove(rootState, options) {
    let moves = rootState.getMoves();
    if (moves.length == 1) {
        return moves[0];
    }
    console.time('computeTree');
    let root = computeTree(rootState, options);
    console.timeEnd('computeTree');
    let gamesPlayed = root.visits;
    console.log(`${gamesPlayed} games played`);
    let bestScore = -1;
    let bestMove;
    for (let node of root.children) {
        let expectedSuccessRate = (node.wins + 1) / (node.visits + 2);
        if (expectedSuccessRate > bestScore) {
            bestMove = node.move;
            bestScore = expectedSuccessRate;
        }
    }
    console.log(`${bestScore} is the best score`);
    return bestMove;
}
exports.computeMove = computeMove;

},{"./assert":2,"./game-model":11}],13:[function(require,module,exports){
"use strict";
const asserts = require('./assert');
const game_model_1 = require('./game-model');
const collections_1 = require('./collections');
const C = 1.44;
function getRandomInteger(upperBounds) {
    return Math.floor(Math.random() * upperBounds);
}
class Node {
    constructor(parent, state, move) {
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
    get isfullyExpanded() {
        return this.validMoves.getSize() == 0;
    }
    getUntriedMove() {
        let index = getRandomInteger(this.validMoves.getSize());
        let move = this.validMoves.item(index);
        this.validMoves.delete(move);
        return move;
    }
    addChild(child) {
        this.children.push(child);
    }
}
class UctSearchService {
    constructor() {
    }
    search(rootState, maxIterations = 1000, maxTime = 1000) {
        let root = new Node(null, rootState);
        let startTime = Date.now();
        let i;
        for (i = 0; i < maxIterations; i++) {
            let current = this.treePolicy(root, rootState);
            let reward = this.defaultPolicy(current.state);
            this.backup(current, reward);
            if (Date.now() - startTime > maxTime) {
                break;
            }
        }
        let bestChild = this.bestChild(root, 0);
        return {
            move: bestChild.move,
            winProbabilty: (bestChild.wins / bestChild.visits),
            time: Date.now() - startTime,
            iterations: i
        };
    }
    treePolicy(node, state) {
        while (!node.isTerminal) {
            if (!node.isfullyExpanded) {
                return this.expand(node);
            }
            else {
                return this.bestChild(node, C);
            }
        }
    }
    expand(node) {
        let a = node.getUntriedMove();
        let newState = node.state.doMove(a);
        let newNode = new Node(node, newState, a);
        node.addChild(newNode);
        return newNode;
    }
    defaultPolicy(state) {
        let moves = state.getMoves();
        while (moves.length > 0) {
            let index = getRandomInteger(moves.length);
            let move = moves[index];
            state = state.doMove(move);
            moves = state.getMoves();
        }
        asserts.assert(!state.hasMoves());
        return (node, player) => {
            let result = state.getResult(player);
            switch (result) {
                case game_model_1.Result.Draw:
                    return 0.5;
                case game_model_1.Result.Win:
                    return 1;
                default:
                    return 0;
            }
        };
    }
    backup(node, reward) {
        while (node) {
            let player = node.state.getOpponent(node.state.getPlayerToMove());
            node.visits++;
            node.wins += reward(node, player);
            node = node.parent;
        }
    }
    bestChild(node, c) {
        node.children.forEach(child => {
            child.confidence = c * Math.sqrt(2 * Math.log(node.visits) / child.visits);
            child.uctScore = (child.wins / child.visits) + child.confidence;
        });
        return collections_1.Arrays.max(node.children, (a, b) => a.uctScore > b.uctScore);
    }
}
exports.UctSearchService = UctSearchService;
exports.UctSearchModule = angular.module('UctSearchModule', [])
    .service('uctSearchService', UctSearchService);

},{"./assert":2,"./collections":10,"./game-model":11}]},{},[1,2,3,4,5,6,7,8,9,10,11,12,13])


//# sourceMappingURL=bundle.js.map
