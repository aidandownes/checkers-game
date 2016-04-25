/// <reference path="../typings/browser.d.ts" />
import {Bitboard, Player, CheckersMove} from './checkers-bitboard';
import {computeMove, ComputeOptions} from './mcts';

export {Player} from './checkers-bitboard';

export class Checkers {
    private boards: Bitboard[];
    private startTime: number;
    private computeOptions: ComputeOptions;

    constructor(private $timeout:ng.ITimeoutService) {
        this.boards = [];
        this.boards.push(new Bitboard());
        this.startTime = (new Date()).getTime();
        this.computeOptions = new ComputeOptions(10000, 5000);
    }
    
    getComputerPlayer() {
        return Player.Two;
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
        let {success, board} = currentBoard.tryMove({source:source, destination:destination, player:currentBoard.player});
        
        // Move successful
        if (success) {
            this.boards.push(board);
            if (board.player == this.getComputerPlayer()) {
                this.$timeout(this.doComputerPlayerMove.bind(this), 500);
            }
            return true;
        } else {
            return false;
        }
    }
    
    doComputerPlayerMove() {
        let move = <CheckersMove>computeMove(this.getCurrentBoard(), this.computeOptions);
        if (move) {
           this.tryMove(move.source, move.destination);
        }
    }
}

export class CheckersProvider {

    $get($injector: ng.auto.IInjectorService) {
        return $injector.instantiate(Checkers);
    }
}