/// <reference path="../typings/browser.d.ts" />
import {Bitboard} from './checkers-bitboard';


export class Checkers {
    boards: Bitboard[];
    
    constructor() {
        this.boards = [];
        this.boards.push(new Bitboard());
    }
    
    getCurrentBoard() :Bitboard {
        return this.boards[this.boards.length - 1];
    }
    
    tryMove(source:number, destination:number): boolean {
        let board = this.getCurrentBoard();
        let newBoard = board.move(source, destination);
        
        // Move successful
        if (board !== newBoard) {
            this.boards.push(newBoard);
            return true;
        } else {
            return false;
        }
    }
}

export class CheckersProvider {

    $get($injector: ng.auto.IInjectorService) {
        return $injector.instantiate(Checkers);
    }
}