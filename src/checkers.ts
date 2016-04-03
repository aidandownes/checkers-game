/// <reference path="../typings/browser.d.ts" />

export const CheckersModule = angular.module('Checkers', []);

const SQUARE_SIZE = 100;
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;

enum Color {
    Black,
    Red
}

function toFillStyle(color: Color) {
    switch (color) {
        case Color.Red:
            return 'red';
        case Color.Black:
            return 'black';
        default:
            throw new Error('Unknown color');
    }
}

export class Checkers {
    ctx: CanvasRenderingContext2D;

    constructor(canvasId:string, private $document: ng.IDocumentService, 
            private $window: ng.IWindowService) {
        let canvasElement = <HTMLCanvasElement>document.getElementById(canvasId);
        this.ctx = canvasElement.getContext('2d');
    }

    private render() {
	   this.drawBoard(); 
    }


    private drawSquare(x: number, y: number, color: Color) {
        this.ctx.fillStyle = toFillStyle(color);
        this.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
    }
    
    private drawBoard() {
        let x = 0;
        let y = 0;
        
        for(let i = 0; i <= ROW_LENGTH; i++) {
            let x = i * SQUARE_SIZE;
            let color = i % 2 ? Color.Red : Color.Black;
            for (let j = 0; j <= COLUMN_LENGTH; j++) {
                let y = j * SQUARE_SIZE;
                this.drawSquare(x, y, color);
                color = Color.Red == color ? Color.Black : Color.Red;
            }
        }
    }

    run() {
        this.render();
        this.$window.requestAnimationFrame(this.run);
    }

}

export class CheckersProvider {
    canvasId: string;

    setCanvasId(canvasId: string) {
        this.canvasId = canvasId;
    }

    $get($injector: ng.auto.IInjectorService) {
        return $injector.instantiate(Checkers, { canvasId: this.canvasId});
    }
}


CheckersModule.provider('checkers', CheckersProvider);