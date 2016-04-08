/// <reference path="../typings/browser.d.ts" />

export const CheckersModule = angular.module('Checkers', []);

const SQUARE_SIZE = 50;
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;

export enum Color {
    Black,
    Red,
    White
}

function toColorString(color: Color) {
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

export interface BoardSquare {
    row: number;
    column: number;
}

export interface Piece {
    square: BoardSquare;
    color: Color;
    isKing: boolean;
    isDragTarget: boolean;
    dragPosition: Position;
}

export interface Position {
    x: number;
    y: number;
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
            this.pieces.push({ square, color, isKing, isDragTarget, dragPosition });
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


class CheckersBoardController {
    ctx: CanvasRenderingContext2D;
    canvas: ng.IAugmentedJQuery;

    constructor(private checkers: Checkers, private $element: ng.IAugmentedJQuery,
        private $window: ng.IWindowService, private $timeout: ng.ITimeoutService,
        private $log: ng.ILogService) {
        let canvasElement = <HTMLCanvasElement>$element[0].querySelector('canvas');
        this.canvas = angular.element(canvasElement);
        this.ctx = canvasElement.getContext('2d');
        
        // Add event listeners
        this.canvas.on("mousedown", this.handleMouseDown.bind(this));
    }

    $postLink() {
        this.render();
    }

    private render() {
        this.$timeout(() => {
            this.drawBoard();
            this.drawPieces();
        });
    }

    private handleMouseDown(ev: JQueryEventObject) {
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
    
    private handleMouseMove(clickedPiece:Piece, ev:JQueryEventObject) {
        let p = this.getMousePosition(ev);
        clickedPiece.dragPosition = p;
        this.render();
    }
    
    private handleMouseUp(clickedPiece:Piece, ev:JQueryEventObject) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        
        clickedPiece.square = sq;
        clickedPiece.isDragTarget = false;
        clickedPiece.dragPosition = p;
        
        this.canvas.off('mousemove');
        this.canvas.off('mouseup');
        this.render();
    }

    private getMousePosition(ev: JQueryEventObject): Position {
        let rect = this.canvas[0].getBoundingClientRect();
        // Get Mouse position in canvas coordinates.
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top
        };
    }

    private getBoardSquare(position: Position): BoardSquare {
        var row = Math.floor(position.y / SQUARE_SIZE);
        var column = Math.floor(position.x / SQUARE_SIZE);
        return { row, column };
    }

    private drawPiece(piece: Piece) {
        const halfSquare = (SQUARE_SIZE * 0.5);
        const x = piece.isDragTarget? piece.dragPosition.x: piece.square.column * SQUARE_SIZE + halfSquare;
        const y = piece.isDragTarget? piece.dragPosition.y: piece.square.row * SQUARE_SIZE + halfSquare;
        
        this.ctx.beginPath();
        this.ctx.fillStyle = toColorString(piece.color);
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = toColorString(Color.Black);
        this.ctx.arc(x,y,
            halfSquare - 10 /* radius */,
            0,
            2 * Math.PI,
            false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }

    private drawPieces() {
        this.checkers.pieces
            .forEach(piece => this.drawPiece(piece));
    }

    private drawSquare(row: number, column: number) {
        let color = row % 2 == column % 2 ? Color.Red : Color.Black;
        let x = row * SQUARE_SIZE;
        let y = column * SQUARE_SIZE;

        this.ctx.fillStyle = toColorString(color);
        this.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    }

    private drawBoard() {
        for (let i = 0; i < ROW_LENGTH; i++) {
            for (let j = 0; j < COLUMN_LENGTH; j++) {
                this.drawSquare(i, j);
            }
        }
    }
}

const CheckersBoard: ng.IComponentOptions = {
    template: `<canvas width="{{$ctrl.width}}" height="{{$ctrl.height}}">
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        width: '<',
        height: '<'
    },
    controller: CheckersBoardController
};

CheckersModule.provider('checkers', CheckersProvider);
CheckersModule.component('checkersBoard', CheckersBoard);