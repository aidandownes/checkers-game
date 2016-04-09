(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const checkers_module_1 = require('./checkers-module');
exports.AppModule = angular.module('app', [checkers_module_1.CheckersModule.name]);

},{"./checkers-module":4}],2:[function(require,module,exports){
"use strict";
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
(function (Player) {
    Player[Player["None"] = 0] = "None";
    Player[Player["White"] = 1] = "White";
    Player[Player["Black"] = 2] = "Black";
})(exports.Player || (exports.Player = {}));
var Player = exports.Player;
exports.SQUARE_COUNT = 32;
class Bitboard {
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = Player.White) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return Player.White;
        }
        else if (this.blackPieces & mask) {
            return Player.Black;
        }
        else {
            return Player.None;
        }
    }
    getMoversWhite() {
        if (this.player != Player.White) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const whiteKings = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied && MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied && MASK_L5) << 5) & this.whitePieces;
        if (whiteKings) {
            movers |= (notOccupied >> 4) & whiteKings;
            movers |= ((notOccupied && MASK_R3) >> 3) & whiteKings;
            movers |= ((notOccupied && MASK_R5) >> 5) & whiteKings;
        }
        return movers;
    }
    move(source, destination) {
        if (this.player != this.getPlayerAtSquare(source)) {
            return this;
        }
        if (this.getPlayerAtSquare(destination) != Player.None) {
            return this;
        }
        let sourceMask = S[source];
        let destinationMask = S[destination];
        if (this.player == Player.White) {
            let isKing = sourceMask & this.kings;
            let canMove = (destinationMask << 4) & sourceMask;
            canMove |= (destinationMask && MASK_L3 << 3) & sourceMask;
            canMove |= (destinationMask && MASK_L5 << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >> 4) & sourceMask;
                canMove |= ((destinationMask && MASK_R3) >> 3) & sourceMask;
                canMove |= ((destinationMask && MASK_R5) >> 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces;
                let kings = this.kings | (destinationMask && 0xF);
                let player = Player.Black;
                return new Bitboard(whitePieces, blackPieces, kings, player);
            }
        }
        else if (this.player = Player.Black) {
            let isKing = sourceMask & this.kings;
            let canMove = (destinationMask >> 4) & sourceMask;
            canMove |= (destinationMask && MASK_R3 >> 3) & sourceMask;
            canMove |= (destinationMask && MASK_R5 >> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask && MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask && MASK_L5) << 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = this.whitePieces;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask && 0xF0000000);
                let player = Player.White;
                return new Bitboard(whitePieces, blackPieces, kings, player);
            }
        }
        throw new Error('Not implemented');
    }
}
exports.Bitboard = Bitboard;

},{}],3:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const SQUARE_SIZE = 50;
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
function toPosition(square) {
    let boardSquare = BoardSquareArray[square];
    let x = boardSquare.column * SQUARE_SIZE;
    let y = boardSquare.row * SQUARE_SIZE;
    return { x: x, y: y };
}
function toSquare(position) {
    var row = Math.floor(position.y / SQUARE_SIZE);
    var column = Math.floor(position.x / SQUARE_SIZE);
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
    constructor(checkers, $element, $window, $timeout, $log) {
        this.checkers = checkers;
        this.$element = $element;
        this.$window = $window;
        this.$timeout = $timeout;
        this.$log = $log;
        let canvasElement = $element[0].querySelector('canvas');
        this.canvas = angular.element(canvasElement);
        this.ctx = canvasElement.getContext('2d');
        this.canvas.on("mousedown", this.handleMouseDown.bind(this));
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
        let sourceSquare = toSquare(p);
        let player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            let squarePosition = toPosition(sourceSquare);
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
        let destinationSquare = toSquare(p);
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
        const halfSquare = (SQUARE_SIZE * 0.5);
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
        let translation = { x: SQUARE_SIZE * 0.5, y: SQUARE_SIZE * 0.5 };
        for (let i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            let fillColor;
            let strokeColor;
            switch (bitboard.getPlayerAtSquare(i)) {
                case checkers_bitboard_1.Player.White:
                    fillColor = 'white';
                    strokeColor = 'black';
                    break;
                case checkers_bitboard_1.Player.Black:
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
                let position = toPosition(i);
                this.drawPiece(position, fillColor, strokeColor, translation);
            }
        }
        if (drawDragTarget) {
            drawDragTarget();
        }
    }
    drawSquare(row, column) {
        let color = row % 2 == column % 2 ? 'white' : 'black';
        let x = row * SQUARE_SIZE;
        let y = column * SQUARE_SIZE;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
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

},{"./checkers-bitboard":2}],4:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
exports.CheckersModule = angular.module('Checkers', []);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);

},{"./checkers-board":3,"./checkers-service":5}],5:[function(require,module,exports){
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
        let board = this.getCurrentBoard();
        let newBoard = board.move(source, destination);
        if (board !== newBoard) {
            this.boards.push(newBoard);
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

},{"./checkers-bitboard":2}]},{},[1,2,3,4,5])


//# sourceMappingURL=bundle.js.map
