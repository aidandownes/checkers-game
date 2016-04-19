/// <reference path="../typings/browser.d.ts" />
import {Bitboard, Player} from './checkers-bitboard';

export {Player} from './checkers-bitboard';

export class Checkers {
    private boards: Bitboard[];
    private startTime: number;

    constructor() {
        this.boards = [];
        this.boards.push(new Bitboard());
        this.startTime = (new Date()).getTime();
    }

    getCurrentPlayer(): Player {
        return this.getCurrentBoard().player;
    }

    getCurrentBoard(): Bitboard {
        return this.boards[this.boards.length - 1];
    }

    getStartTime(): number {
        return this.startTime;
    }

    tryMove(source: number, destination: number): boolean {
        let currentBoard = this.getCurrentBoard();
        let {success, board} = currentBoard.tryMove(source, destination);
        
        // Move successful
        if (success) {
            this.boards.push(board);
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