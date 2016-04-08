"use strict";
exports.ROW_LENGTH = 8;
exports.COLUMN_LENGTH = 8;
(function (Color) {
    Color[Color["Black"] = 0] = "Black";
    Color[Color["Red"] = 1] = "Red";
    Color[Color["White"] = 2] = "White";
})(exports.Color || (exports.Color = {}));
var Color = exports.Color;
function* getPossiblePositions() {
    for (let i = 0; i < exports.ROW_LENGTH; i++) {
        for (let j = 0; j < exports.COLUMN_LENGTH; j++) {
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
            this.pieces.push({ square: square, color: color, isKing: isKing });
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
