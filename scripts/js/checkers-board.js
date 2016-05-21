"use strict";
var checkers_bitboard_1 = require('./checkers-bitboard');
var game_model_1 = require('./game-model');
var collections_1 = require('./collections');
var asserts = require('./assert');
var utils = require('./utils');
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
    function CheckersBoardController(checkers, $element, $window, $log, $scope, $q) {
        var _this = this;
        this.checkers = checkers;
        this.$element = $element;
        this.$window = $window;
        this.$log = $log;
        this.$scope = $scope;
        this.$q = $q;
        this.canvasElement = $element[0].querySelector('canvas');
        this.canvas = angular.element(this.canvasElement);
        this.ctx = this.canvasElement.getContext('2d');
        this.canvas.on('mousedown', this.handleMouseDown.bind(this));
        this.canvas.on('mousemove', this.handleMouseMove.bind(this));
        this.canvas.on('mouseup', this.handleMouseUp.bind(this));
        this.canvasElement.addEventListener('touchstart', function (e) {
            var p = _this.getTouchPoint(e);
            _this.startDrag(p);
            if (_this.isDragging) {
                e.preventDefault();
            }
        });
        this.canvasElement.addEventListener('touchmove', function (e) {
            var p = _this.getTouchPoint(e);
            _this.updateDrag(p);
            if (_this.isDragging) {
                e.preventDefault();
            }
        });
        this.canvasElement.addEventListener('touchend', function (e) {
            _this.endDrag(_this.dragPosition);
        });
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
        if (width != 0 && height != 0) {
            this.render();
        }
    };
    CheckersBoardController.prototype.startDrag = function (p) {
        var sourceSquare = toSquare(p, this.squareSize);
        var player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            var squarePosition = toPosition(sourceSquare, this.squareSize);
            this.isDragging = true;
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = p.subtract(squarePosition);
            this.canvas.addClass(DraggingClass);
            this.canvas.removeClass(DragClass);
            this.render();
        }
    };
    CheckersBoardController.prototype.endDrag = function (p) {
        if (!this.isDragging) {
            return;
        }
        var destinationSquare = toSquare(p, this.squareSize);
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        this.isDragging = false;
        this.dragTarget = -1;
        this.dragPosition = null;
        this.canvas.removeClass(DraggingClass);
        this.render();
    };
    CheckersBoardController.prototype.updateDrag = function (p) {
        if (this.isDragging) {
            var position = p;
            position.x = utils.clamp(position.x, 0 + this.dragTranslation.x, this.canvasElement.width - this.squareSize + this.dragTranslation.x);
            position.y = utils.clamp(position.y, 0 + this.dragTranslation.y, this.canvasElement.height - this.squareSize + this.dragTranslation.y);
            this.dragPosition = position;
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
    CheckersBoardController.prototype.handleMouseDown = function (ev) {
        this.startDrag(this.getMousePoint(ev));
    };
    CheckersBoardController.prototype.handleMouseMove = function (ev) {
        this.updateDrag(this.getMousePoint(ev));
    };
    CheckersBoardController.prototype.handleMouseUp = function (ev) {
        this.endDrag(this.getMousePoint(ev));
    };
    CheckersBoardController.prototype.getMousePoint = function (ev) {
        var rect = this.canvasElement.getBoundingClientRect();
        return new Point(ev.clientX - rect.left, ev.clientY - rect.top);
    };
    CheckersBoardController.prototype.getTouchPoint = function (ev) {
        var rect = this.canvasElement.getBoundingClientRect();
        var touches = ev.touches;
        var touch = touches[0];
        return new Point(touch.clientX - rect.left, touch.clientY - rect.top);
    };
    CheckersBoardController.prototype.drawPiece = function (point, player, isKing, translation) {
        var _this = this;
        this.spritesPromise.then(function (img) {
            var sourceX = isKing ? (2 * 50) : 0;
            if (player == game_model_1.Player.One) {
                sourceX += 50;
            }
            var drawPoint = point;
            if (translation) {
                drawPoint = drawPoint.subtract(translation);
            }
            asserts.assert(img.width >= sourceX + _this.spriteSize, 'Attempting to access outside sprite region');
            asserts.assert(img.height >= 0 + _this.spriteSize, 'Attempting to access outside sprite region');
            asserts.assert(_this.canvasElement.width >= drawPoint.x + _this.squareSize, 'Drawing outside canvas');
            asserts.assert(_this.canvasElement.height >= drawPoint.y + _this.squareSize, 'Drawing outside canvas');
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
