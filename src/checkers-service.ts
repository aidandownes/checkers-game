/// <reference path="../typings/browser.d.ts" />
import {Bitboard, CheckersMove} from './checkers-bitboard';
import {UctSearchService, SearchResult} from './uct';
import {Player} from './game-model';

export {SearchResult, UctSearchService} from './uct';

const DEFAULT_MAX_TIME_MS = 500;
const DEFAULT_MAX_ITERATIONS = 10000;

export interface ComputeOptions {
    maxTime?: number;
    maxIterations?: number;
}

export class Checkers {
    private boards: Bitboard[];
    startTime: number;
    searchResult: SearchResult;
    computeOptions: ComputeOptions;
    lastMove: CheckersMove;
    computerPlayer = Player.Two;
    humanPlayer = Player.One;

    constructor(private $timeout: ng.ITimeoutService, private uctSearchService: UctSearchService) {
        this.computeOptions = {
            maxIterations: DEFAULT_MAX_ITERATIONS,
            maxTime: DEFAULT_MAX_TIME_MS
        };
        this.reset();
    }

    reset() {
        this.boards = [];
        this.boards.push(new Bitboard());
        this.startTime = (new Date()).getTime();
        this.searchResult = null;
    }

    getCurrentPlayer(): Player {
        return this.getCurrentBoard().player;
    }

    getCurrentBoard(): Bitboard {
        return this.boards[this.boards.length - 1];
    }
    
    getPlayablePieces(): number[] {
        if (this.getCurrentPlayer() != this.humanPlayer) {
            return [];
        }
        
        return this.getCurrentBoard().getMoves().map(m => m.source);
    }
    
    getOpponent(player: Player): Player {
        if (player == Player.None) return Player.None;
        return player == Player.One ? Player.Two : Player.One;
    }

    tryMove(source: number, destination: number): boolean {
        let currentBoard = this.getCurrentBoard();
        let move = { source: source, destination: destination, player: currentBoard.player };
        let {success, board} = currentBoard.tryMove(move);

        // Move successful
        if (success) {
            this.boards.push(board);
            this.lastMove = move;
            if (board.player == this.computerPlayer) {
                this.$timeout(this.doComputerPlayerMove.bind(this), 500);
            }
            return true;
        } else {
            return false;
        }
    }

    private doComputerPlayerMove() {
        this.searchResult = this.uctSearchService.search(this.getCurrentBoard(),
            this.computeOptions.maxIterations,
            this.computeOptions.maxTime);
        if (this.searchResult.move) {
            let move = <CheckersMove>this.searchResult.move;
            this.tryMove(move.source, move.destination);
        }
    }
}

export class CheckersProvider {
    $get($injector: ng.auto.IInjectorService) {
        return $injector.instantiate(Checkers);
    }
}