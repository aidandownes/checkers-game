import {Checkers} from './checkers-service';
import {Bitboard, Player, SQUARE_COUNT} from './checkers-bitboard';

const SQUARE_SIZE = 60;
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;

interface Point {
    x: number;
    y: number;
}

interface BoardSquare {
    row: number,
    column: number;
}

const BoardSquareArray = (function() : BoardSquare[] {
    let squares: BoardSquare[] = [];
    for (let i = 0; i < ROW_LENGTH; i++) {
        let mod2 = i % 2;
        for (let j = 7 - mod2; j >  0 - mod2; j -= 2) {
            squares.push({row: i, column: j});
        }
    }
    return squares.reverse();
})();

function toPosition(square:number) : Point {
    let boardSquare = BoardSquareArray[square];
    let x = boardSquare.column * SQUARE_SIZE;
    let y = boardSquare.row * SQUARE_SIZE;
    return {x, y};
}

function toSquare(position: Point): number {
    var row = Math.floor(position.y / SQUARE_SIZE);
    var column = Math.floor(position.x / SQUARE_SIZE);
    return BoardSquareArray.findIndex(bs => bs.column == column && bs.row == row);
}

function add(p1:Point, p2:Point) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}

function subtract(p1:Point, p2:Point) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}

class CheckersBoardController {
    ctx: CanvasRenderingContext2D;
    canvas: ng.IAugmentedJQuery;
    dragTarget: number;
    dragPosition: Point;
    dragTranslation: Point;

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
            this.drawPieces(this.checkers.getCurrentBoard());
        });
    }

    private handleMouseDown(ev: JQueryEventObject) {
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
    
    private handleMouseMove(ev:JQueryEventObject) {
        let p = this.getMousePoint(ev);
        this.dragPosition = p;
        this.render();
    }
    
    private handleMouseUp(ev:JQueryEventObject) {
        let p = this.getMousePoint(ev);
        let destinationSquare = toSquare(p);
        
        // Attempt move.
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        
        // Reset dragTarget information.
        this.dragTarget = -1;
        this.dragPosition = <Point>null;
        
        // Remove handlers for drag target.
        this.canvas.off('mousemove');
        this.canvas.off('mouseup');
        
        // Redraw board.
        this.render();
    }

    private getMousePoint(ev: JQueryEventObject): Point {
        let rect = this.canvas[0].getBoundingClientRect();
        // Get Mouse position in canvas coordinates.
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top
        };
    }

    private drawPiece(point: Point, fillColor:string, strokeColor:string, translation:Point) {
        const halfSquare = (SQUARE_SIZE * 0.5);
        const x = point.x + translation.x;
        const y = point.y + translation.y;
        
        this.ctx.beginPath();
        this.ctx.fillStyle = fillColor;
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.arc(x,y,
            halfSquare - 10 /* radius */,
            0,
            2 * Math.PI,
            false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }

    private drawPieces(bitboard: Bitboard) {
        // Holds delayed draw operation for drag target.
        let drawDragTarget: () => void;
        let translation:Point = {x: SQUARE_SIZE * 0.5, y: SQUARE_SIZE * 0.5};
        
        for(let i = 0; i < SQUARE_COUNT; i++) {
            let fillColor:string;
            let strokeColor:string;
            
            switch (bitboard.getPlayerAtSquare(i)) {
                case Player.White:
                    fillColor = 'white';
                    strokeColor = 'black';
                    break;
                case Player.Black:
                    fillColor = 'black';
                    strokeColor = 'white';
                    break;
                default:
                    continue;
            }
            
            
            // Draw drag target later.
            if (i == this.dragTarget) {
                let dragTranslation = subtract(translation, this.dragTranslation);
                drawDragTarget = this.drawPiece.bind(
                    this, this.dragPosition, fillColor, strokeColor, dragTranslation);
            }
            else {
                let position = toPosition(i);
                this.drawPiece(position, fillColor, strokeColor, translation);
            }
        }
        
        // Draw drag target.
        if (drawDragTarget) {
            drawDragTarget();
        }
    }

    private drawSquare(row: number, column: number) {
        let color = row % 2 == column % 2 ? 'white': 'black' 
        let x = row * SQUARE_SIZE;
        let y = column * SQUARE_SIZE;

        this.ctx.fillStyle =  color;
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