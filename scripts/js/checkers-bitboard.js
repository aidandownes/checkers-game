"use strict";
const game_model_1 = require('./game-model');
const Asserts = require('./assert');
const S = (function () {
    let squares = [];
    for (let i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();
const MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
const MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
const MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
const MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];
exports.SQUARE_COUNT = 32;
class Bitboard {
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = game_model_1.Player.One) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == game_model_1.Player.One) {
            let canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.Two;
        }
        else {
            let canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.One;
        }
        Asserts.assert((blackPieces & whitePieces) == 0);
    }
    doMove(move) {
        let result = this.tryMove(move);
        Asserts.assert(result.success, 'Move was not succesful');
        return result.board;
    }
    doRandomMove() {
        let moves = this.getMoves();
        Asserts.assertNotEmpty(moves);
        let randomMoveIndex = Math.floor(Math.random() * moves.length);
        return this.doMove(moves[randomMoveIndex]);
    }
    hasMoves() {
        return this.getMoves().length > 0;
    }
    getMoves() {
        if (!this.moves) {
            this.moves = [];
            for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                if (this.getPlayerAtSquare(i) != this.player) {
                    continue;
                }
                Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
            }
            if (this.moves.length == 0) {
                for (let i = 0; i < exports.SQUARE_COUNT; i++) {
                    if (this.getPlayerAtSquare(i) != this.player) {
                        continue;
                    }
                    Array.prototype.push.apply(this.moves, this.getHopMoves(i));
                }
            }
        }
        return this.moves;
    }
    getResult(player) {
        Asserts.assert(this.winner == game_model_1.Player.One || this.winner == game_model_1.Player.Two);
        return this.winner == player ? game_model_1.Result.Win : game_model_1.Result.Lose;
    }
    getPlayerToMove() {
        return this.player;
    }
    getOpponent(player) {
        switch (player) {
            case game_model_1.Player.One:
                return game_model_1.Player.Two;
            case game_model_1.Player.Two:
                return game_model_1.Player.One;
            default:
                return game_model_1.Player.None;
        }
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return game_model_1.Player.One;
        }
        else if (this.blackPieces & mask) {
            return game_model_1.Player.Two;
        }
        else {
            return game_model_1.Player.None;
        }
    }
    getHopMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        var hops = 0;
        if (isKing || (player == game_model_1.Player.One)) {
            hops |= (mask >>> 4) & notOccupied;
            hops |= ((mask & MASK_R3) >>> 3) & notOccupied;
            hops |= ((mask & MASK_R5) >>> 5) & notOccupied;
        }
        if (isKing || (player == game_model_1.Player.Two)) {
            hops |= (mask << 4) & notOccupied;
            hops |= ((mask & MASK_L3) << 3) & notOccupied;
            hops |= ((mask & MASK_L5) << 5) & notOccupied;
        }
        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & hops) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    }
    rightJump(opponentPieces, notOccupied, mask) {
        var jumps = 0;
        let temp = (mask >>> 4) & opponentPieces;
        jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
        temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
        jumps |= (temp >>> 4) & notOccupied;
        return jumps;
    }
    leftJump(opponentPieces, notOccupied, mask) {
        var jumps = 0;
        let temp = (mask << 4) & opponentPieces;
        jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
        temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
        jumps |= (temp << 4) & notOccupied;
        return jumps;
    }
    getJumpMoves(source) {
        let moves = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        var jumps = 0;
        if (player == game_model_1.Player.One) {
            jumps |= this.rightJump(this.blackPieces, notOccupied, mask);
            if (isKing) {
                jumps |= this.leftJump(this.blackPieces, notOccupied, mask);
            }
        }
        else if (player == game_model_1.Player.Two) {
            jumps |= this.leftJump(this.whitePieces, notOccupied, mask);
            if (isKing) {
                jumps |= this.rightJump(this.whitePieces, notOccupied, mask);
            }
        }
        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & jumps) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    }
    getHoppersWhite() {
        if (this.player != game_model_1.Player.One) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        var movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >>> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >>> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >>> 5) & kingPieces;
        }
        return movers;
    }
    getHoppersBlack() {
        if (this.player != game_model_1.Player.Two) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        var movers = (notOccupied >>> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >>> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >>> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied << 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    }
    getJumpersWhite(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = whitePieces & kings;
        var movers = 0;
        let temp = (notOccupied << 4) & blackPieces;
        movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & whitePieces;
        temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & blackPieces;
        movers |= (temp << 4) & whitePieces;
        if (kingPieces) {
            temp = (notOccupied >>> 4) & blackPieces;
            movers |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & kingPieces;
            temp = (((notOccupied & MASK_R3) >>> 3) | ((notOccupied & MASK_R5) >>> 5)) & blackPieces;
            movers |= (temp >>> 4) & kingPieces;
        }
        return movers;
    }
    getJumpersBlack(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = blackPieces & kings;
        var movers = 0;
        let temp = (notOccupied >>> 4) & whitePieces;
        movers |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & blackPieces;
        temp = (((notOccupied & MASK_R3) >>> 3) | ((notOccupied & MASK_R5) >>> 5)) & whitePieces;
        movers |= (temp >>> 4) & blackPieces;
        if (kingPieces) {
            temp = (notOccupied << 4) & whitePieces;
            movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & kingPieces;
            temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & whitePieces;
            movers |= (temp << 4) & kingPieces;
        }
        return movers;
    }
    tryStep(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            var canMove = (destinationMask << 4) & sourceMask;
            canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
            canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >>> 4) & sourceMask;
                canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
                canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces;
                let kings = isKing ? (this.kings | destinationMask) ^ sourceMask : this.kings | (destinationMask & 0xF);
                let player = game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player = game_model_1.Player.Two) {
            var canMove = (destinationMask >>> 4) & sourceMask;
            canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
            canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = this.whitePieces;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask & 0xF0000000);
                let player = game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryJump(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            let canJump;
            let temp = (destinationMask << 4) & this.blackPieces;
            canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask >>> 4) & this.blackPieces;
                canJump = (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_R3) >>> 3) | ((destinationMask & MASK_R5) >>> 5)) & this.blackPieces;
                canJump = (temp >> 4) & sourceMask;
            }
            if (canJump) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces ^ temp;
                let kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? game_model_1.Player.One : game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == game_model_1.Player.Two) {
            let canJump;
            let temp = (destinationMask >>> 4) & this.whitePieces;
            canJump = (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_R3) >>> 3) | ((destinationMask & MASK_R5) >>> 5)) & this.whitePieces;
                canJump = (temp >>> 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask << 4) & this.whitePieces;
                canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.whitePieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (canJump) {
                let whitePieces = this.whitePieces ^ temp;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? game_model_1.Player.Two : game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryMove(move) {
        const failureResult = { success: false };
        const sourceMask = S[move.source];
        const destinationMask = S[move.destination];
        const isKing = sourceMask & this.kings;
        if (this.winner != game_model_1.Player.None) {
            failureResult.message = 'Game is over';
            return failureResult;
        }
        if (this.player != this.getPlayerAtSquare(move.source)) {
            failureResult.message = 'Wrong player move';
            return failureResult;
        }
        if (this.getPlayerAtSquare(move.destination) != game_model_1.Player.None) {
            failureResult.message = 'Destination is not empty';
            return failureResult;
        }
        let jumpers = this.player == game_model_1.Player.One ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            let shouldJump = jumpers & sourceMask;
            if (shouldJump) {
                return this.tryJump(move.source, move.destination);
            }
            else {
                failureResult.message = 'Player should jump';
                return failureResult;
            }
        }
        return this.tryStep(move.source, move.destination);
    }
    toString() {
        let buffer = [];
        let prependSpace = false;
        let getPieceString = (index) => {
            let mask = S[index];
            let pieceString = '__';
            if (mask & this.blackPieces) {
                pieceString = (mask & this.kings) ? 'BK' : 'BP';
            }
            else if (mask & this.whitePieces) {
                pieceString = (mask & this.kings) ? 'WK' : 'WP';
            }
            return pieceString;
        };
        for (let i = 0; i < exports.SQUARE_COUNT; i += 4) {
            let lineBuffer = [];
            for (let j = i; j < i + 4; j++) {
                if (prependSpace) {
                    lineBuffer.push(' ');
                }
                lineBuffer.push(getPieceString(j));
                if (!prependSpace) {
                    lineBuffer.push(' ');
                }
            }
            lineBuffer.push('\n');
            prependSpace = !prependSpace;
            buffer.splice(0, 0, lineBuffer.join(' '));
        }
        return buffer.join(' ');
    }
}
exports.Bitboard = Bitboard;
