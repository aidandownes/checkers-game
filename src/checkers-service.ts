/// <reference path="../typings/browser.d.ts" />

export const ROW_LENGTH = 8;
export const COLUMN_LENGTH = 8;

export enum Color {
    Black,
    Red,
    White
}

export interface BoardSquare {
    row: number;
    column: number;
}

export interface Piece {
    square: BoardSquare;
    color: Color;
    isKing: boolean;
}

function* getPossiblePositions(): Iterable<BoardSquare> {
    for (let i = 0; i < ROW_LENGTH; i++) {
        for (let j = 0; j < COLUMN_LENGTH; j++) {
            if (i % 2 == j % 2) {
                yield { row: i, column: j };
            }
        }
    }
}



export class Checkers {
    pieces: Piece[];
    currentPlayer: Color;

    constructor() {
        this.pieces = new Array();
        this.initializePieces();
        this.currentPlayer = Color.White;
    }

    private initializePieces() {
        const isKing = false;
        const isDragTarget = false;
        const dragPosition = { x: 0, y: 0 };
        const addPiece = (square: BoardSquare, color: Color) => {
            this.pieces.push({ square, color, isKing});
        };

        for (let pos of getPossiblePositions()) {
            if (pos.row < 3) {
                addPiece(pos, Color.White);
            } else if (pos.row > 4) {
                addPiece(pos, Color.Black);
            }
        }
    }

    getPieceAtSquare(square: BoardSquare): Piece {
        return this.pieces.find(p => {
            return p.square.column == square.column &&
                p.square.row == square.row;
        });
    }
}

export class CheckersProvider {

    $get($injector: ng.auto.IInjectorService) {
        return $injector.instantiate(Checkers);
    }
}