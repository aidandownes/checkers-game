"use strict";
const checkers_service_1 = require('./checkers-service');
const SQUARE_SIZE = 50;
function toColorString(color) {
    switch (color) {
        case checkers_service_1.Color.Red:
            return 'red';
        case checkers_service_1.Color.Black:
            return 'black';
        case checkers_service_1.Color.White:
            return 'white';
        default:
            throw new Error('Unknown color');
    }
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
            this.drawPieces();
        });
    }
    handleMouseDown(ev) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        let clickedPiece = this.checkers.getPieceAtSquare(sq);
        if (clickedPiece && clickedPiece.color == this.checkers.currentPlayer) {
            this.dragTarget = clickedPiece;
            this.dragPosition = p;
            this.canvas.on('mousemove', this.handleMouseMove.bind(this));
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.render();
        }
    }
    handleMouseMove(ev) {
        let p = this.getMousePosition(ev);
        this.dragPosition = p;
        this.render();
    }
    handleMouseUp(ev) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        this.dragTarget.square = sq;
        this.dragTarget = null;
        this.dragPosition = null;
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
    drawPiece(piece, position) {
        const halfSquare = (SQUARE_SIZE * 0.5);
        const x = (position && position.x) || piece.square.column * SQUARE_SIZE + halfSquare;
        const y = (position && position.y) || piece.square.row * SQUARE_SIZE + halfSquare;
        this.ctx.beginPath();
        this.ctx.fillStyle = toColorString(piece.color);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = toColorString(checkers_service_1.Color.Black);
        this.ctx.arc(x, y, halfSquare - 10, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }
    drawPieces() {
        this.checkers.pieces
            .filter(piece => piece != this.dragTarget)
            .forEach(piece => this.drawPiece(piece));
        if (this.dragTarget) {
            this.drawPiece(this.dragTarget, this.dragPosition);
        }
    }
    drawSquare(row, column) {
        let color = row % 2 == column % 2 ? checkers_service_1.Color.Red : checkers_service_1.Color.Black;
        let x = row * SQUARE_SIZE;
        let y = column * SQUARE_SIZE;
        this.ctx.fillStyle = toColorString(color);
        this.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    }
    drawBoard() {
        for (let i = 0; i < checkers_service_1.ROW_LENGTH; i++) {
            for (let j = 0; j < checkers_service_1.COLUMN_LENGTH; j++) {
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
