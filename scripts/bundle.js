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
}
exports.AppModule.config(configureThemes);

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
            for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                if (this.getPlayerAtSquare(i) != this.player) {
                    continue;
                }
                Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
            }
            if (this.moves.length == 0) {
                for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                    if (this.getPlayerAtSquare(i) != this.player) {
                        continue;
                    }
                    Array.prototype.push.apply(this.moves, this.getHopMoves(i));
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

},{"./assert":2,"./game-model":10}],4:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const game_model_1 = require('./game-model');
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;
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
    return { x: x, y: y };
}
function toSquare(position, squareSize) {
    var row = Math.floor(position.y / squareSize);
    var column = Math.floor(position.x / squareSize);
    return BoardSquareArray.findIndex(bs => bs.column == column && bs.row == row);
}
function add(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
function subtract(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
class CheckersBoardController {
    constructor(checkers, $element, $window, $timeout, $log, $scope) {
        this.checkers = checkers;
        this.$element = $element;
        this.$window = $window;
        this.$timeout = $timeout;
        this.$log = $log;
        this.$scope = $scope;
        let canvasElement = $element[0].querySelector('canvas');
        this.canvas = angular.element(canvasElement);
        this.ctx = canvasElement.getContext('2d');
        this.canvas.on("mousedown", this.handleMouseDown.bind(this));
        $scope.$watch(() => this.checkers.getCurrentBoard(), () => this.render());
    }
    $onInit() {
        this.squareSize = this.width / ROW_LENGTH;
    }
    $postLink() {
        this.render();
    }
    render() {
        this.$timeout(() => {
            this.drawBoard();
            this.drawPieces(this.checkers.getCurrentBoard());
        });
    }
    handleMouseDown(ev) {
        let p = this.getMousePoint(ev);
        let sourceSquare = toSquare(p, this.squareSize);
        let player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            let squarePosition = toPosition(sourceSquare, this.squareSize);
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = subtract(p, squarePosition);
            this.canvas.on('mousemove', this.handleMouseMove.bind(this));
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.render();
        }
    }
    handleMouseMove(ev) {
        let p = this.getMousePoint(ev);
        this.dragPosition = p;
        this.render();
    }
    handleMouseUp(ev) {
        let p = this.getMousePoint(ev);
        let destinationSquare = toSquare(p, this.squareSize);
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        this.dragTarget = -1;
        this.dragPosition = null;
        this.canvas.off('mousemove');
        this.canvas.off('mouseup');
        this.render();
    }
    getMousePoint(ev) {
        let rect = this.canvas[0].getBoundingClientRect();
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top
        };
    }
    drawPiece(point, fillColor, strokeColor, translation) {
        const halfSquare = (this.squareSize * 0.5);
        const x = point.x + translation.x;
        const y = point.y + translation.y;
        this.ctx.beginPath();
        this.ctx.fillStyle = fillColor;
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.arc(x, y, halfSquare - 10, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }
    drawPieces(bitboard) {
        let drawDragTarget;
        let translation = { x: this.squareSize * 0.5, y: this.squareSize * 0.5 };
        for (let i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            let fillColor;
            let strokeColor;
            switch (bitboard.getPlayerAtSquare(i)) {
                case game_model_1.Player.One:
                    fillColor = 'white';
                    strokeColor = 'black';
                    break;
                case game_model_1.Player.Two:
                    fillColor = 'black';
                    strokeColor = 'white';
                    break;
                default:
                    continue;
            }
            if (bitboard.isKing(i)) {
                strokeColor = 'red';
            }
            if (i == this.dragTarget) {
                let dragTranslation = subtract(translation, this.dragTranslation);
                drawDragTarget = this.drawPiece.bind(this, this.dragPosition, fillColor, strokeColor, dragTranslation);
            }
            else {
                let position = toPosition(i, this.squareSize);
                this.drawPiece(position, fillColor, strokeColor, translation);
            }
        }
        if (drawDragTarget) {
            drawDragTarget();
        }
    }
    drawSquare(row, column) {
        let color = row % 2 == column % 2 ? 'white' : 'black';
        let x = row * this.squareSize;
        let y = column * this.squareSize;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
    }
    drawBoard() {
        for (let i = 0; i < ROW_LENGTH; i++) {
            for (let j = 0; j < COLUMN_LENGTH; j++) {
                this.drawSquare(i, j);
            }
        }
    }
}
exports.CheckersBoard = {
    template: `<canvas width="{{$ctrl.width}}" height="{{$ctrl.height}}">
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        width: '<',
        height: '<'
    },
    controller: CheckersBoardController
};

},{"./checkers-bitboard":3,"./game-model":10}],5:[function(require,module,exports){
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

},{"./checkers-service":8}],6:[function(require,module,exports){
"use strict";
const game_model_1 = require('./game-model');
class GameStatsController {
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

},{"./game-model":10}],7:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
const checkers_game_stats_1 = require('./checkers-game-stats');
exports.CheckersModule = angular.module('Checkers', []);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
exports.CheckersModule.component('checkersGameStats', checkers_game_stats_1.CheckersGameStats);
exports.CheckersModule.filter('timeFilter', checkers_game_stats_1.TimeFormatFilter);

},{"./checkers-board":4,"./checkers-game-stats":6,"./checkers-service":8}],8:[function(require,module,exports){
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

},{"./checkers-bitboard":3,"./game-model":10,"./uct":12}],9:[function(require,module,exports){
"use strict";
const Asserts = require('./assert');
class HashMap {
    constructor() {
        this.map = new Map();
    }
    set(key, value) {
        Asserts.assert(!!key);
        this.map.set(key.getHashCode(), value);
    }
    get(key) {
        Asserts.assert(!!key);
        return this.map.get(key.getHashCode());
    }
    has(key) {
        Asserts.assert(!!key);
        return this.map.has(key.getHashCode());
    }
}
exports.HashMap = HashMap;
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
}
exports.List = List;

},{"./assert":2}],10:[function(require,module,exports){
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

},{"./assert":2,"./game-model":10}],12:[function(require,module,exports){
"use strict";
const asserts = require('./assert');
const game_model_1 = require('./game-model');
const collections_1 = require('./collections');
const C = 1.44;
function getRandomNumber(upperBounds) {
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
        this.validMoves = new collections_1.List(state.getMoves());
        this.isTerminal = this.validMoves.size == 0;
    }
    get isfullyExpanded() {
        return this.validMoves.size == 0;
    }
    getUntriedMove() {
        let index = getRandomNumber(this.validMoves.size);
        let move = this.validMoves.item(index);
        this.validMoves.delete(move);
        return move;
    }
    addChild(child) {
        this.children.push(child);
    }
}
class UctSearch {
    constructor(maxIterations = 1000) {
        this.maxIterations = maxIterations;
    }
    search(rootState) {
        console.time('search');
        let root = new Node(null, rootState);
        for (let i = 0; i < this.maxIterations; i++) {
            let current = this.treePolicy(root, rootState);
            let reward = this.defaultPolicy(current.state);
            this.backup(current, reward);
        }
        let bestChild = this.bestChild(root, 0);
        console.timeEnd('search');
        console.log(`(${bestChild.wins} wins / ${bestChild.visits} visits) = ${bestChild.wins / bestChild.visits}`);
        return bestChild.move;
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
            let index = getRandomNumber(moves.length);
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
        let values = node.children.map(child => ({
            child: child,
            confidence: (child.wins / child.visits) + (c * Math.sqrt((2 * Math.log(node.visits) / child.visits)))
        }));
        return collections_1.Arrays.max(values, (a, b) => a.confidence > b.confidence).child;
    }
}
exports.UctSearch = UctSearch;

},{"./assert":2,"./collections":9,"./game-model":10}]},{},[1,2,3,4,5,6,7,8,9,10,11,12])


//# sourceMappingURL=bundle.js.map
