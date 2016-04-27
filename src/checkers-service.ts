/// <reference path="../typings/browser.d.ts" />
import {Bitboard, CheckersMove} from './checkers-bitboard';
import {UctSearch, SearchResult} from './uct';
import {Player} from './game-model';

export {SearchResult} from './uct';

const DEFAULT_MAX_TIME_MS = 500;
const DEFAULT_MAX_ITERATIONS = 10000;

export class Checkers {
    private boards: Bitboard[];
    private startTime: number;
    private uctSearch: UctSearch;
    private searchResult: SearchResult;
    
    constructor(private $timeout:ng.ITimeoutService) {
        this.reset();
    }
    
    reset(maxTime:number = DEFAULT_MAX_TIME_MS, 
            maxIterations:number = DEFAULT_MAX_ITERATIONS) {
        this.boards = [];
        this.boards.push(new Bitboard());
        this.startTime = (new Date()).getTime();
        this.uctSearch = new UctSearch(maxIterations, maxTime);
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
    
    getSearchResult(): SearchResult {
        return this.searchResult;
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
        this.searchResult = this.uctSearch.search(this.getCurrentBoard());
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