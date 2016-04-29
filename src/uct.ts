/// <reference path="../typings/browser.d.ts" />
import * as asserts from './assert';
import {Player, Move, GameState, Result} from './game-model';
import {List, Arrays} from './collections';

/** Exploration constant */
const C = 1.44;

/** 
 * Gets a random integer.
 * @param upperBounds Upper bounds for random integer. Exclusive.
 * @return A random integer between 0 and upperBounds. 
 */
function getRandomInteger(upperBounds:number) {
    return Math.floor(Math.random() * upperBounds);
}

/**
 * Represents a reward for the current node and player.
 */
interface Reward {
    (node:Node, player:Player): number;
}

/**
 * Represents the best move along with stats about the search.
 */
export interface SearchResult {
    move: Move;
    winProbabilty: number;
    time: number;
    iterations: number;
}

/**
 * Represents a node in the game state tree.
 */
class Node {
    validMoves: List<Move>;
    isTerminal: boolean;
    children: Node[] = [];
    wins: number = 0;
    visits: number = 0;
    uctScore: number = 0;
    confidence: number = 0;
    
    /**
     * Creates a new node. 
     * @param parent The parent node.
     * @param state The game state associated with this node.
     * @param move Optional.  The move that lead to the associated game state.
     */
    constructor(public parent:Node, public state:GameState, public move?:Move) {
        this.validMoves = new List(state.getMoves());
        this.isTerminal = this.validMoves.size == 0;
    }
    
    /**
     * Wheter all moves have been tried.
     * @retun True if all moves have been tried. False otherwise.
     */
    get isfullyExpanded(): boolean {
        return this.validMoves.size == 0;
    }
    
    /**
     * Gets a move that has not been tried.
     * @return The untried move.
     */
    getUntriedMove(): Move {
        let index = getRandomInteger(this.validMoves.size);
        let move = this.validMoves.item(index);
        this.validMoves.delete(move);
        return move;
    }
    
    /**
     * Adds a new node to the tree as a child.
     * @param child The new child node.
     */
    addChild(child: Node) {
        this.children.push(child);
    }
    
}

/**
 * Represents a search for the best move using the
 * upper confidence bounds for tree algorithm + MCTS.
 */
export class UctSearchService {
   
    /**
     * Creates an instance of the search service.
     */
    constructor() {
    }
    
    /**
     * Searches the game state for the next move. 
     * @param rootState The game state to start the search from.
     * @param maxIterations Optinal. The maximum number of iterations to perform the search.
     * @param maxTime Optinal. The maximum time to perform the search.
     */
    search(rootState:GameState, 
            maxIterations:number = 1000,
            maxTime:number = 1000): SearchResult {
        let root = new Node(null, rootState);
        let startTime =  Date.now();
        let i:number;
        
        for (i = 0; i < maxIterations; i++) {
            let current = this.treePolicy(root, rootState);
            let reward = this.defaultPolicy(current.state);
            this.backup(current, reward);
            
            if (Date.now() - startTime > maxTime) {
                break;
            }
        }
        
        let bestChild = this.bestChild(root, 0); 
        return {
            move: bestChild.move,
            winProbabilty: (bestChild.wins / bestChild.visits),
            time: Date.now() - startTime,
            iterations: i
        };
    }
    
    private treePolicy(node:Node, state:GameState): Node {
        while(!node.isTerminal) {
            if (!node.isfullyExpanded) {
                return this.expand(node);
            } else {
                return this.bestChild(node, C);
            }
        }
    }
    
    private expand(node:Node): Node {
        let a = node.getUntriedMove();
        let newState = node.state.doMove(a);
        let newNode = new Node(node, newState, a);
        node.addChild(newNode);
        return newNode;
    }
    
    private defaultPolicy(state:GameState): Reward  {
        let moves = state.getMoves();
        while(moves.length > 0) {
            let index = getRandomInteger(moves.length);
            let move = moves[index];
            state = state.doMove(move);
            moves = state.getMoves();
        }     
        
        asserts.assert(!state.hasMoves());
        
        return (node:Node, player:Player): number => {
            let result = state.getResult(player);
            switch (result) {
                case Result.Draw:
                    return 0.5;
                case Result.Win:
                    return 1;
                default:
                    return 0;
            }
        };
    }
    
    private backup(node:Node, reward:Reward) {
        while(node) {
            let player = node.state.getOpponent(node.state.getPlayerToMove());
            node.visits++;
            node.wins += reward(node, player);
            node = node.parent;
        }
    }
    
    private bestChild(node:Node, c:number): Node {
        node.children.forEach(child => {
            child.confidence = c * Math.sqrt(2 * Math.log(node.visits) / child.visits);
            child.uctScore = (child.wins / child.visits) + child.confidence;
        });
        return Arrays.max(node.children, (a, b) => a.uctScore > b.uctScore);
    }
}


export const UctSearchModule = angular.module('UctSearchModule', [])
    .service('uctSearchService', UctSearchService);