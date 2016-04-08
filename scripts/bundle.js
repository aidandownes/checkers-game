(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const checkers_1 = require('./checkers');
exports.AppModule = angular.module('app', [checkers_1.CheckersModule.name]);

},{"./checkers":2}],2:[function(require,module,exports){
"use strict";
exports.CheckersModule = angular.module('Checkers', []);
const SQUARE_SIZE = 50;
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;
(function (Color) {
    Color[Color["Black"] = 0] = "Black";
    Color[Color["Red"] = 1] = "Red";
    Color[Color["White"] = 2] = "White";
})(exports.Color || (exports.Color = {}));
var Color = exports.Color;
function toColorString(color) {
    switch (color) {
        case Color.Red:
            return 'red';
        case Color.Black:
            return 'black';
        case Color.White:
            return 'white';
        default:
            throw new Error('Unknown color');
    }
}
function* getPossiblePositions() {
    for (let i = 0; i < ROW_LENGTH; i++) {
        for (let j = 0; j < COLUMN_LENGTH; j++) {
            if (i % 2 == j % 2) {
                yield { row: i, column: j };
            }
        }
    }
}
class Checkers {
    constructor() {
        this.pieces = new Array();
        this.initializePieces();
        this.currentPlayer = Color.White;
    }
    initializePieces() {
        const isKing = false;
        const isDragTarget = false;
        const dragPosition = { x: 0, y: 0 };
        const addPiece = (square, color) => {
            this.pieces.push({ square: square, color: color, isKing: isKing, isDragTarget: isDragTarget, dragPosition: dragPosition });
        };
        for (let pos of getPossiblePositions()) {
            if (pos.row < 3) {
                addPiece(pos, Color.White);
            }
            else if (pos.row > 4) {
                addPiece(pos, Color.Black);
            }
        }
    }
    getPieceAtSquare(square) {
        return this.pieces.find(p => {
            return p.square.column == square.column &&
                p.square.row == square.row;
        });
    }
}
exports.Checkers = Checkers;
class CheckersProvider {
    $get($injector) {
        return $injector.instantiate(Checkers);
    }
}
exports.CheckersProvider = CheckersProvider;
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
            this.drawPieces();
        });
    }
    handleMouseDown(ev) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        let clickedPiece = this.checkers.getPieceAtSquare(sq);
        this.$log.debug(`Position ${JSON.stringify(p)}; 
            Square ${JSON.stringify(sq)}; 
            Piece ${JSON.stringify(clickedPiece)}`);
        if (clickedPiece && clickedPiece.color == this.checkers.currentPlayer) {
            clickedPiece.isDragTarget = true;
            clickedPiece.dragPosition = p;
            this.canvas.on('mousemove', this.handleMouseMove.bind(this, clickedPiece));
            this.canvas.on('mouseup', this.handleMouseUp.bind(this, clickedPiece));
            this.render();
        }
    }
    handleMouseMove(clickedPiece, ev) {
        let p = this.getMousePosition(ev);
        clickedPiece.dragPosition = p;
        this.render();
    }
    handleMouseUp(clickedPiece, ev) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        clickedPiece.square = sq;
        clickedPiece.isDragTarget = false;
        clickedPiece.dragPosition = p;
        this.canvas.off('mousemove');
        this.canvas.off('mouseup');
        this.render();
    }
    getMousePosition(ev) {
        let rect = this.canvas[0].getBoundingClientRect();
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top
        };
    }
    getBoardSquare(position) {
        var row = Math.floor(position.y / SQUARE_SIZE);
        var column = Math.floor(position.x / SQUARE_SIZE);
        return { row: row, column: column };
    }
    drawPiece(piece) {
        const halfSquare = (SQUARE_SIZE * 0.5);
        const x = piece.isDragTarget ? piece.dragPosition.x : piece.square.column * SQUARE_SIZE + halfSquare;
        const y = piece.isDragTarget ? piece.dragPosition.y : piece.square.row * SQUARE_SIZE + halfSquare;
        this.ctx.beginPath();
        this.ctx.fillStyle = toColorString(piece.color);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = toColorString(Color.Black);
        this.ctx.arc(x, y, halfSquare - 10, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }
    drawPieces() {
        this.checkers.pieces
            .forEach(piece => this.drawPiece(piece));
    }
    drawSquare(row, column) {
        let color = row % 2 == column % 2 ? Color.Red : Color.Black;
        let x = row * SQUARE_SIZE;
        let y = column * SQUARE_SIZE;
        this.ctx.fillStyle = toColorString(color);
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
const CheckersBoard = {
    template: `<canvas width="{{$ctrl.width}}" height="{{$ctrl.height}}">
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        width: '<',
        height: '<'
    },
    controller: CheckersBoardController
};
exports.CheckersModule.provider('checkers', CheckersProvider);
exports.CheckersModule.component('checkersBoard', CheckersBoard);

},{}]},{},[1,2])


//# sourceMappingURL=bundle.js.map
