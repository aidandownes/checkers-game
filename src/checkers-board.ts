import {Checkers} from './checkers-service';
import {Bitboard, SQUARE_COUNT} from './checkers-bitboard';
import {Player} from './game-model';

const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;

class Point {
    private x_: number;
    private y_: number;
    
    constructor(x: number, y: number) {
        this.x_ = x;
        this.y_ = y;
    }
    
    get x() : number {
        return this.x_;
    }
    
    get y() : number {
        return this.y_;
    }
    
    add(other:Point): Point {
        return new Point(this.x_ + other.x_, this.y_ + other.y_);
    }
    
    subtract(other:Point): Point {
        return new Point(this.x_ - other.x_, this.y_ - other.y_);
    }
}

interface BoardSquare {
    row: number,
    column: number;
}

const BoardSquareArray = (function (): BoardSquare[] {
    let squares: BoardSquare[] = [];
    for (let i = 0; i < ROW_LENGTH; i++) {
        let mod2 = i % 2;
        for (let j = 7 - mod2; j > 0 - mod2; j -= 2) {
            squares.push({ row: i, column: j });
        }
    }
    return squares.reverse();
})();

function toPosition(square: number, squareSize: number): Point {
    let boardSquare = BoardSquareArray[square];
    let x = boardSquare.column * squareSize;
    let y = boardSquare.row * squareSize;
    return new Point(x, y);
}

function toSquare(position: Point, squareSize: number): number {
    var row = Math.floor(position.y / squareSize);
    var column = Math.floor(position.x / squareSize);
    return BoardSquareArray.findIndex(bs => bs.column == column && bs.row == row);
}

class CheckersBoardController {
    ctx: CanvasRenderingContext2D;
    canvas: ng.IAugmentedJQuery;
    canvasElement: HTMLCanvasElement;
    dragTarget: number;
    dragPosition: Point;
    dragTranslation: Point;
    squareSize: number;
    width: number;
    height: number;
    spritesPromise: ng.IPromise<HTMLImageElement>;
    spritesImageUrl: string;
    spriteSize: number;

    constructor(private checkers: Checkers, private $element: ng.IAugmentedJQuery,
        private $window: ng.IWindowService, private $timeout: ng.ITimeoutService,
        private $log: ng.ILogService, private $scope: ng.IScope, private $q: ng.IQService) {
        this.canvasElement = <HTMLCanvasElement>$element[0].querySelector('canvas');
        this.canvas = angular.element(this.canvasElement);
        this.ctx = this.canvasElement.getContext('2d');
        this.width = this.$element.width();
        this.height = this.$element.height();
        this.squareSize = this.width / ROW_LENGTH;

        // Add event listeners
        this.canvas.on('mousedown', this.handleMouseDown.bind(this));

        $scope.$watch(() => this.$element.width(), this.resize.bind(this));
        $scope.$watch(() => this.checkers.getCurrentBoard(), () => this.render());
    }

    $postLink() {
        this.spritesPromise = this.loadImage(this.spritesImageUrl);
        this.render();
    }

    private loadImage(src: string): ng.IPromise<HTMLImageElement> {
        let defer = this.$q.defer();
        let img = new Image();
        img.src = src;
        img.onload = (ev) => {
            defer.resolve(img);
        };
        return defer.promise;
    }

    private render() {
        this.spritesPromise.then(() => {
            this.$timeout(() => {
                this.drawBoard();
                this.drawPieces(this.checkers.getCurrentBoard());
            });
        });
    }

    private resize() {
        // Update the board's size vars;
        this.width = this.$element.width();
        this.height = this.$element.height();
        this.squareSize = this.width / ROW_LENGTH;
        
        // Resize the canvas;
        this.canvasElement.width = this.width;
        this.canvasElement.height = this.width;
        
        // Redraw board.
        this.render();
    }

    private handleMouseDown(ev: JQueryEventObject) {
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

    private handleMouseMove(ev: JQueryEventObject) {
        let p = this.getMousePoint(ev);
        this.dragPosition = p;
        this.render();
    }

    private handleMouseUp(ev: JQueryEventObject) {
        let p = this.getMousePoint(ev);
        let destinationSquare = toSquare(p, this.squareSize);

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
        return new Point(ev.clientX - rect.left, ev.clientY - rect.top);
    }

    private drawPiece(point: Point, player: Player, isKing:boolean, translation?: Point) {
        this.spritesPromise.then(img =>  {
            let sourceX = isKing ? (2 * this.spriteSize) : 0;
            if (player == Player.One) {
                sourceX += this.spriteSize;
            }
            
            // Use to adjust sprite image position. Should really fix sprite.
            let spriteAdjust = new Point(2, 2);
            let drawPoint = point.add(spriteAdjust);
            if (translation) {
                drawPoint = drawPoint.subtract(translation);
            }
            
            this.ctx.drawImage(img, sourceX, 0, this.spriteSize, this.spriteSize, 
                drawPoint.x, drawPoint.y, this.squareSize, this.squareSize); 
        });
    }

    private drawPieces(bitboard: Bitboard) {
        // Holds delayed draw operation for drag target.
        let drawDragTarget: () => void;

        for (let i = 0; i < SQUARE_COUNT; i++) {
            let player = bitboard.getPlayerAtSquare(i);
            if (player == Player.None) {
                continue;
            }
            
            let isKing = bitboard.isKing(i);
            // Draw drag target later.
            if (i == this.dragTarget) {
                drawDragTarget = this.drawPiece.bind(
                    this, this.dragPosition, player, isKing, this.dragTranslation);
            }
            else {
                let position = toPosition(i, this.squareSize);
                this.drawPiece(position, player, isKing);
            }
        }

        // Draw drag target.
        if (drawDragTarget) {
            drawDragTarget();
        }
    }

    private drawSquare(square: number) {
        let position = toPosition(square, this.squareSize);

        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(position.x, position.y, this.squareSize, this.squareSize);
    }
    
    private highlightSquare(square:number) {
        let position = toPosition(square, this.squareSize);

        this.ctx.strokeStyle = '#FF5722';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(position.x, position.y, this.squareSize, this.squareSize);
        
    }

    private drawBoard() {
        // Paint board white.
        this.ctx.fillStyle = '#FFF';
        this.ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
       
        // Paint black squares.         
        for (let i = 0; i < SQUARE_COUNT; i++) {
            this.drawSquare(i);
        }
        
        let lastMove = this.checkers.getLastMove();
        if (lastMove) {
            this.highlightSquare(lastMove.source);
            this.highlightSquare(lastMove.destination);
        }
    }
}

/**
 * Checkers board directive. 
 * Atributes: 
 *  - spritesImageUrl: The url link to load for pieces sprite image. Expected to be a horizontal stripe.
 *  - spritesSize: The size of each piece in the sprites image.
 */
export const CheckersBoard: ng.IComponentOptions = {
    template: `<canvas>
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        spritesImageUrl: '@',
        spriteSize: '<'
    },
    controller: CheckersBoardController
};