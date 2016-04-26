/// <reference path="../typings/browser.d.ts" />
import * as asserts from './assert';
import {Player, Move, GameState, Result} from './game-model';
import {List, Arrays} from './collections';

const C = 1.44;

function getRandomNumber(upperBounds:number) {
    return Math.floor(Math.random() * upperBounds);
}

interface Reward {
    (node:Node, player:Player): number;
}

class Node {
    validMoves: List<Move>;
    isTerminal: boolean;
    children: Node[] = [];
    wins: number = 0;
    visits: number = 0;
    
    constructor(public parent:Node, public state:GameState, public move?:Move) {
        this.validMoves = new List(state.getMoves());
        this.isTerminal = this.validMoves.size == 0;
    }
    
    get isfullyExpanded(): boolean {
        return this.validMoves.size == 0;
    }
    
    getUntriedMove() {
        let index = getRandomNumber(this.validMoves.size);
        let move = this.validMoves.item(index);
        this.validMoves.delete(move);
        return move;
    }
    
    addChild(child: Node) {
        this.children.push(child);
    }
    
}

export class UctSearch {
   
    constructor(private maxIterations:number = 1000) {
        
    }
    
    search(rootState:GameState): Move {
        console.time('search');
        let root = new Node(null, rootState);
       
        for (let i = 0; i < this.maxIterations; i++) {
            let current = this.treePolicy(root, rootState);
            let reward = this.defaultPolicy(current.state);
            this.backup(current, reward);
        }
        
        let bestChild = this.bestChild(root, 0);
        console.timeEnd('search');
        console.log(`(${bestChild.wins} wins / ${bestChild.visits} visits) = ${bestChild.wins/bestChild.visits}`);
        return bestChild.move;
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
            let index = getRandomNumber(moves.length);
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
        let values = node.children.map(child => ({
            child: child,
            confidence: (child.wins / child.visits) + (c * Math.sqrt((
                2 * Math.log(node.visits) / child.visits
            )))
        }));
        
        return Arrays.max(values, (a, b) => a.confidence > b.confidence).child;
    }
}