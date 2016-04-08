import {Checkers, Piece, BoardSquare, Color, ROW_LENGTH, COLUMN_LENGTH} from './checkers-service';

const SQUARE_SIZE = 50;

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


interface Position {
    x: number;
    y: number;
}

class CheckersBoardController {
    ctx: CanvasRenderingContext2D;
    canvas: ng.IAugmentedJQuery;
    dragTarget: Piece;
    dragPosition: Position;

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

        if (clickedPiece && clickedPiece.color == this.checkers.currentPlayer) {
            this.dragTarget = clickedPiece;
            this.dragPosition = p;
            
            this.canvas.on('mousemove', this.handleMouseMove.bind(this));
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.render();
        }
    }
    
    private handleMouseMove(ev:JQueryEventObject) {
        let p = this.getMousePosition(ev);
        this.dragPosition = p;
        this.render();
    }
    
    private handleMouseUp(ev:JQueryEventObject) {
        let p = this.getMousePosition(ev);
        let sq = this.getBoardSquare(p);
        
        this.dragTarget.square = sq;
        this.dragTarget = <Piece>null;
        this.dragPosition = <Position>null;
        
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

    private drawPiece(piece: Piece, position?:Position) {
        const halfSquare = (SQUARE_SIZE * 0.5);
        const x = (position && position.x) || piece.square.column * SQUARE_SIZE + halfSquare;
        const y = (position && position.y) || piece.square.row * SQUARE_SIZE + halfSquare;
        
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
            .filter(piece => piece != this.dragTarget)
            .forEach(piece => this.drawPiece(piece));
            
        if (this.dragTarget) {
            this.drawPiece(this.dragTarget, this.dragPosition);
        }
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

export const CheckersBoard: ng.IComponentOptions = {
    template: `<canvas width="{{$ctrl.width}}" height="{{$ctrl.height}}">
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        width: '<',
        height: '<'
    },
    controller: CheckersBoardController
};