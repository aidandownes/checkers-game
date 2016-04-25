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
const mcts_1 = require('./mcts');
const Asserts = require('./assert');
var mcts_2 = require('./mcts');
exports.Player = mcts_2.Player;
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
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = mcts_1.Player.One) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == mcts_1.Player.One) {
            let canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? mcts_1.Player.None : mcts_1.Player.Two;
        }
        else {
            let canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? mcts_1.Player.None : mcts_1.Player.One;
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
        Asserts.assert(this.winner == mcts_1.Player.One || this.winner == mcts_1.Player.Two);
        return this.winner == player ? mcts_1.Result.Win : mcts_1.Result.Lose;
    }
    getPlayerToMove() {
        return this.player;
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return mcts_1.Player.One;
        }
        else if (this.blackPieces & mask) {
            return mcts_1.Player.Two;
        }
        else {
            return mcts_1.Player.None;
        }
    }
    getHopMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        let hops = 0;
        if (isKing || (player == mcts_1.Player.One)) {
            hops |= (mask >>> 4) & notOccupied;
            hops |= ((mask & MASK_R3) >>> 3) & notOccupied;
            hops |= ((mask & MASK_R5) >>> 5) & notOccupied;
        }
        if (isKing || (player == mcts_1.Player.Two)) {
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
    getJumpMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        let jumps = 0;
        let rightJump = (opponentPieces) => {
            let temp = (mask >>> 4) & opponentPieces;
            jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
            temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
            jumps |= (temp >>> 4) & notOccupied;
        };
        let leftJump = (opponentPieces) => {
            let temp = (mask << 4) & opponentPieces;
            jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
            temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
            jumps |= (temp << 4) & notOccupied;
        };
        if (player == mcts_1.Player.One) {
            rightJump(this.blackPieces);
            if (isKing) {
                leftJump(this.blackPieces);
            }
        }
        else if (player == mcts_1.Player.Two) {
            leftJump(this.whitePieces);
            if (isKing) {
                rightJump(this.whitePieces);
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
        if (this.player != mcts_1.Player.One) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
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
        if (this.player != mcts_1.Player.Two) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        let movers = (notOccupied >>> 4) & this.blackPieces;
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
        let movers = 0;
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
        let movers = 0;
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
        if (this.player == mcts_1.Player.One) {
            let canMove = (destinationMask << 4) & sourceMask;
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
                let kings = isKing ? (this.kings | destinationMask) ^ sourceMask : this.kings | (destinationMask & 0xF);
                let player = mcts_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player = mcts_1.Player.Two) {
            let canMove = (destinationMask >>> 4) & sourceMask;
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
                let kings = this.kings | (destinationMask & 0xF0000000);
                let player = mcts_1.Player.One;
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
        if (this.player == mcts_1.Player.One) {
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
                let kings = this.kings | (destinationMask & 0xF);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? mcts_1.Player.One : mcts_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == mcts_1.Player.Two) {
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
                let kings = this.kings | (destinationMask & 0xF0000000);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? mcts_1.Player.Two : mcts_1.Player.One;
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
        if (this.winner != mcts_1.Player.None) {
            failureResult.message = 'Game is over';
            return failureResult;
        }
        if (this.player != this.getPlayerAtSquare(move.source)) {
            failureResult.message = 'Wrong player move';
            return failureResult;
        }
        if (this.getPlayerAtSquare(move.destination) != mcts_1.Player.None) {
            failureResult.message = 'Destination is not empty';
            return failureResult;
        }
        let jumpers = this.player == mcts_1.Player.One ?
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

},{"./assert":2,"./mcts":9}],4:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
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
                case checkers_bitboard_1.Player.One:
                    fillColor = 'white';
                    strokeColor = 'black';
                    break;
                case checkers_bitboard_1.Player.Two:
                    fillColor = 'black';
                    strokeColor = 'white';
                    break;
                default:
                    continue;
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

},{"./checkers-bitboard":3}],5:[function(require,module,exports){
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
const checkers_service_1 = require('./checkers-service');
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
            case checkers_service_1.Player.One:
                return 'White';
            case checkers_service_1.Player.Two:
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

},{"./checkers-service":8}],7:[function(require,module,exports){
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

},{"./checkers-bitboard":3,"./mcts":9}],9:[function(require,module,exports){
"use strict";
const asserts = require('./assert');
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
            case Result.Draw:
                this.wins += 0.5;
                break;
            case Result.Win:
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

},{"./assert":2}]},{},[1,2,3,4,5,6,7,8,9])


//# sourceMappingURL=bundle.js.map
