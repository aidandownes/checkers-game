/// <reference path="../typings/browser.d.ts" />
import * as asserts from './assert';

export enum Player {
    None,
    One,
    Two
}

export enum Result {
    Win,
    Lose,
    Draw
}

export interface Move {
}

/**
 * Game state interface.
 */
export interface GameState {
    /**
     *  Do the requested move. 
     *  @param move The move to execute.
     */
    doMove(move: Move): GameState;

    /** 
     * Do a random move. 
     */
    doRandomMove(): GameState;

    /**
     * Check if there moves for the current player.
     * @return True if the player can move. False otherwise.
     */
    hasMoves(): boolean;

    /**
     * Gets a list possible moves for the current player. 
     * @return A list of possible moves.
     */
    getMoves(): Move[];

    /**
     * Gets the result for finished game for the player.
     * @param player The player to query for.
     * @return The result for the player.
     */
    getResult(player: Player): Result;
    
    /**
     * Gets the current player.
     * @return the current player.
     */
    getPlayerToMove(): Player;
}


export class ComputeOptions {
    constructor(
        public maxIterations: number = 10000,
        public maxTime: number = -1,
        public verbose: boolean = false
    ) {
    }
}

class Node {
    playerToMove: Player;
    wins: number;
    visits: number;
    moves: Move[];
    uctScore: number;
    children: Node[];
    
    constructor(public state: GameState, public move?: Move, 
        public parent?:  Node ) {
        this.playerToMove = state.getPlayerToMove();
        this.wins = 0;
        this.visits = 0;
        this.moves = state.getMoves();
        this.uctScore = 0;
        this.children = [];
    }
    
    hasUntriedMoves() : boolean {
        return this.moves.length > 0;
    }
    
    getUntriedMove(): Move {
        asserts.assertNotEmpty(this.moves);
        // Get random index in move array.
        let index = Math.floor(Math.random() * this.moves.length);
        return this.moves[index];
    }
    
    getBestChild(): Node {
        asserts.assertEmpty(this.moves);
        asserts.assertNotEmpty(this.children);
        return this.children.reduce((pv, cv) => pv.visits > cv.visits ? pv : cv);
    }
    
    selectChildViaUctScore() : Node {
        for(let child of this.children) {
            let winRatio = child.wins / child.visits;
            let confidence  = Math.sqrt(2 * Math.log(this.visits) / child.visits);   
            child.uctScore = winRatio + confidence;
        }
        return this.children.reduce((pv, cv) => pv.uctScore > cv.uctScore ? pv: cv);
    }
    
    addChild(move:Move, state:GameState) : Node {
        // Create and add new child.
        let newChild = new Node(state, move, this);
        this.children.push(newChild);
        //  Remove from move list. 
        let index = this.moves.indexOf(move);
        this.moves.splice(index, 1);
        // Return newly added child.
        return newChild;
    }
    
    update(result:Result): void {
        switch (result) {
            case Result.Draw:
                this.wins += 0.5;
                break;
            case Result.Win:
                this.wins++;
            default:
                break;
        }
        this.visits++;
    }
    
    hasChildren(): boolean {
        return this.children.length > 0;
    }
}


function computeTree(rootState:GameState, options:ComputeOptions): Node {
    asserts.assert(options.maxIterations >= 0 || options.maxTime >= 0);
    const root = new Node(rootState);
    const startTime = new Date();
    
    for(let i = 0; i < options.maxIterations || options.maxTime < 0; i++) {
        let node = root;
        let state = rootState;
        
        // Select path to the best leaf node.
        while(!node.hasUntriedMoves() && node.hasChildren()) {
            node = node.selectChildViaUctScore();
            state = state.doMove(node.move);
        }
        
        // If we are not already at the final state, expand the
		// tree with a new node and move there.
        if(node.hasUntriedMoves()) {
            let move = node.getUntriedMove();
            state = state.doMove(move);
            node = node.addChild(move, state);
        }
        
        // We now play randomly until the game ends.
        while(state.hasMoves()) {
            state = state.doRandomMove();
        }
        
        while(node) {
            node.update(state.getResult(node.playerToMove));
            node = node.parent;
        }
        
       
        if (options.maxTime > 0) {
            let elapsedTime = (new Date().getTime()) - startTime.getTime();
            if (elapsedTime >= options.maxTime) {
                break;
            }
        }
    }
    return root;
}


export function computeMove(rootState:GameState, options:ComputeOptions): Move {
    let moves = rootState.getMoves();
    if (moves.length == 1) {
        return moves[0];
    }
    
    // Ideally we should be running a bunch of computations in parallel
    console.time('computeTree');
    let root = computeTree(rootState, options);
    console.timeEnd('computeTree');
    let gamesPlayed: number = root.visits;
    console.log(`${gamesPlayed} games played`);

   
    
    // Find the node with the most visits.
    let bestScore = -1;
    let bestMove: Move;
    
    for(let node of root.children) {
       let expectedSuccessRate = (node.wins + 1) / (node.visits + 2);
       if (expectedSuccessRate >  bestScore) {
           bestMove = node.move;
           bestScore = expectedSuccessRate;
       }
    }
    
    console.log(`${bestScore} is the best score`);
    return bestMove;  
}