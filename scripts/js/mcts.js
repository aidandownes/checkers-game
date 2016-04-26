"use strict";
const asserts = require('./assert');
const game_model_1 = require('./game-model');
class ComputeOptions {
    constructor(maxIterations = 10000, maxTime = -1, verbose = false) {
        this.maxIterations = maxIterations;
        this.maxTime = maxTime;
        this.verbose = verbose;
    }
}
exports.ComputeOptions = ComputeOptions;
class Node {
    constructor(state, move, parent) {
        this.state = state;
        this.move = move;
        this.parent = parent;
        this.playerToMove = state.getPlayerToMove();
        this.wins = 0;
        this.visits = 0;
        this.moves = state.getMoves();
        this.uctScore = 0;
        this.children = [];
    }
    hasUntriedMoves() {
        return this.moves.length > 0;
    }
    getUntriedMove() {
        asserts.assertNotEmpty(this.moves);
        let index = Math.floor(Math.random() * this.moves.length);
        return this.moves[index];
    }
    getBestChild() {
        asserts.assertEmpty(this.moves);
        asserts.assertNotEmpty(this.children);
        return this.children.reduce((pv, cv) => pv.visits > cv.visits ? pv : cv);
    }
    selectChildViaUctScore() {
        for (let child of this.children) {
            let winRatio = child.wins / child.visits;
            let confidence = Math.sqrt(2 * Math.log(this.visits) / child.visits);
            child.uctScore = winRatio + confidence;
        }
        return this.children.reduce((pv, cv) => pv.uctScore > cv.uctScore ? pv : cv);
    }
    addChild(move, state) {
        let newChild = new Node(state, move, this);
        this.children.push(newChild);
        let index = this.moves.indexOf(move);
        this.moves.splice(index, 1);
        return newChild;
    }
    update(result) {
        switch (result) {
            case game_model_1.Result.Draw:
                this.wins += 0.5;
                break;
            case game_model_1.Result.Win:
                this.wins++;
            default:
                break;
        }
        this.visits++;
    }
    hasChildren() {
        return this.children.length > 0;
    }
}
function computeTree(rootState, options) {
    asserts.assert(options.maxIterations >= 0 || options.maxTime >= 0);
    const root = new Node(rootState);
    const startTime = new Date();
    for (let i = 0; i < options.maxIterations || options.maxTime < 0; i++) {
        let node = root;
        let state = rootState;
        while (!node.hasUntriedMoves() && node.hasChildren()) {
            node = node.selectChildViaUctScore();
            state = state.doMove(node.move);
        }
        if (node.hasUntriedMoves()) {
            let move = node.getUntriedMove();
            state = state.doMove(move);
            node = node.addChild(move, state);
        }
        while (state.hasMoves()) {
            state = state.doRandomMove();
        }
        while (node) {
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
function computeMove(rootState, options) {
    let moves = rootState.getMoves();
    if (moves.length == 1) {
        return moves[0];
    }
    console.time('computeTree');
    let root = computeTree(rootState, options);
    console.timeEnd('computeTree');
    let gamesPlayed = root.visits;
    console.log(`${gamesPlayed} games played`);
    let bestScore = -1;
    let bestMove;
    for (let node of root.children) {
        let expectedSuccessRate = (node.wins + 1) / (node.visits + 2);
        if (expectedSuccessRate > bestScore) {
            bestMove = node.move;
            bestScore = expectedSuccessRate;
        }
    }
    console.log(`${bestScore} is the best score`);
    return bestMove;
}
exports.computeMove = computeMove;
