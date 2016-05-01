"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const game_model_1 = require('./game-model');
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;
class Point {
    constructor(x, y) {
        this.x_ = x;
        this.y_ = y;
    }
    get x() {
        return this.x_;
    }
    get y() {
        return this.y_;
    }
    add(other) {
        return new Point(this.x_ + other.x_, this.y_ + other.y_);
    }
    subtract(other) {
        return new Point(this.x_ - other.x_, this.y_ - other.y_);
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
        this.width = this.$element.width();
        this.height = this.$element.height();
        this.squareSize = this.width / ROW_LENGTH;
        this.canvas.on('mousedown', this.handleMouseDown.bind(this));
        $scope.$watch(() => this.$element.width(), this.resize.bind(this));
        $scope.$watch(() => this.checkers.getCurrentBoard(), () => this.render());
    }
    $postLink() {
        this.spritesPromise = this.loadImage(this.spritesImageUrl);
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
            this.$timeout(() => {
                this.drawBoard();
                this.drawPieces(this.checkers.getCurrentBoard());
            });
        });
    }
    resize() {
        this.width = this.$element.width();
        this.height = this.$element.height();
        this.squareSize = this.width / ROW_LENGTH;
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.width;
        this.render();
    }
    handleMouseDown(ev) {
        let p = this.getMousePoint(ev);
        let sourceSquare = toSquare(p, this.squareSize);
        let player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            let squarePosition = toPosition(sourceSquare, this.squareSize);
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = p.subtract(squarePosition);
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
        let lastMove = this.checkers.getLastMove();
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
