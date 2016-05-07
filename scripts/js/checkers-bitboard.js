"use strict";
var game_model_1 = require('./game-model');
var Asserts = require('./assert');
var S = (function () {
    var squares = [];
    for (var i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();
var MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
var MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
var MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
var MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];
exports.SQUARE_COUNT = 32;
var Bitboard = (function () {
    function Bitboard(whitePieces, blackPieces, kings, player) {
        if (whitePieces === void 0) { whitePieces = 0xFFF00000; }
        if (blackPieces === void 0) { blackPieces = 0x00000FFF; }
        if (kings === void 0) { kings = 0; }
        if (player === void 0) { player = game_model_1.Player.One; }
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == game_model_1.Player.One) {
            var canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.Two;
        }
        else {
            var canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? game_model_1.Player.None : game_model_1.Player.One;
        }
        Asserts.assert((blackPieces & whitePieces) == 0);
    }
    Bitboard.prototype.doMove = function (move) {
        var result = this.tryMove(move);
        Asserts.assert(result.success, 'Move was not succesful');
        return result.board;
    };
    Bitboard.prototype.doRandomMove = function () {
        var moves = this.getMoves();
        Asserts.assertNotEmpty(moves);
        var randomMoveIndex = Math.floor(Math.random() * moves.length);
        return this.doMove(moves[randomMoveIndex]);
    };
    Bitboard.prototype.hasMoves = function () {
        return this.getMoves().length > 0;
    };
    Bitboard.prototype.getMoves = function () {
        if (!this.moves) {
            this.moves = [];
            var jumpers = (this.player == game_model_1.Player.One) ?
                this.getJumpersWhite() :
                this.getJumpersBlack();
            for (var i = 0; i < exports.SQUARE_COUNT; i++) {
                if (S[i] & jumpers) {
                    Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
                }
            }
            if (this.moves.length == 0) {
                var hoppers = (this.player == game_model_1.Player.One) ?
                    this.getHoppersWhite() :
                    this.getHoppersBlack();
                for (var i = 0; i < exports.SQUARE_COUNT; i++) {
                    if (S[i] & hoppers) {
                        Array.prototype.push.apply(this.moves, this.getHopMoves(i));
                    }
                }
            }
        }
        return this.moves;
    };
    Bitboard.prototype.getResult = function (player) {
        Asserts.assert(this.winner == game_model_1.Player.One || this.winner == game_model_1.Player.Two);
        return this.winner == player ? game_model_1.Result.Win : game_model_1.Result.Lose;
    };
    Bitboard.prototype.getPlayerToMove = function () {
        return this.player;
    };
    Bitboard.prototype.getOpponent = function (player) {
        switch (player) {
            case game_model_1.Player.One:
                return game_model_1.Player.Two;
            case game_model_1.Player.Two:
                return game_model_1.Player.One;
            default:
                return game_model_1.Player.None;
        }
    };
    Bitboard.prototype.getPlayerAtSquare = function (square) {
        var mask = S[square];
        if (this.whitePieces & mask) {
            return game_model_1.Player.One;
        }
        else if (this.blackPieces & mask) {
            return game_model_1.Player.Two;
        }
        else {
            return game_model_1.Player.None;
        }
    };
    Bitboard.prototype.isKing = function (square) {
        var mask = S[square];
        return !!(this.kings & mask);
    };
    Bitboard.prototype.getHopMoves = function (source) {
        var moves = [];
        var mask = S[source];
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var isKing = mask & this.kings;
        var player = this.player;
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
        for (var destination = 0; destination < 32; destination++) {
            if (S[destination] & hops) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    };
    Bitboard.prototype.rightJump = function (opponentPieces, notOccupied, mask) {
        var jumps = 0;
        var temp = (mask >>> 4) & opponentPieces;
        jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
        temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
        jumps |= (temp >>> 4) & notOccupied;
        return jumps;
    };
    Bitboard.prototype.leftJump = function (opponentPieces, notOccupied, mask) {
        var jumps = 0;
        var temp = (mask << 4) & opponentPieces;
        jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
        temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
        jumps |= (temp << 4) & notOccupied;
        return jumps;
    };
    Bitboard.prototype.getJumpMoves = function (source) {
        var moves = [];
        var mask = S[source];
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var isKing = mask & this.kings;
        var player = this.player;
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
        for (var destination = 0; destination < 32; destination++) {
            if (S[destination] & jumps) {
                moves.push({ source: source, destination: destination, player: player });
            }
        }
        return moves;
    };
    Bitboard.prototype.getHoppersWhite = function () {
        if (this.player != game_model_1.Player.One) {
            return 0;
        }
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var kingPieces = this.whitePieces & this.kings;
        var movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >>> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >>> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >>> 5) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.getHoppersBlack = function () {
        if (this.player != game_model_1.Player.Two) {
            return 0;
        }
        var notOccupied = ~(this.whitePieces | this.blackPieces);
        var kingPieces = this.blackPieces & this.kings;
        var movers = (notOccupied >>> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >>> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >>> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied << 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    };
    Bitboard.prototype.getJumpersWhite = function (whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        var notOccupied = ~(whitePieces | blackPieces);
        var kingPieces = whitePieces & kings;
        var movers = 0;
        var temp = (notOccupied << 4) & blackPieces;
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
    };
    Bitboard.prototype.getJumpersBlack = function (whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        var notOccupied = ~(whitePieces | blackPieces);
        var kingPieces = blackPieces & kings;
        var movers = 0;
        var temp = (notOccupied >>> 4) & whitePieces;
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
    };
    Bitboard.prototype.tryStep = function (source, destination) {
        var sourceMask = S[source];
        var destinationMask = S[destination];
        var isKing = sourceMask & this.kings;
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
                var whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                var blackPieces = this.blackPieces;
                var kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                var player = game_model_1.Player.Two;
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
                var whitePieces = this.whitePieces;
                var blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                var kings = isKing ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                var player = game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    };
    Bitboard.prototype.tryJump = function (source, destination) {
        var sourceMask = S[source];
        var destinationMask = S[destination];
        var isKing = sourceMask & this.kings;
        if (this.player == game_model_1.Player.One) {
            var canJump = void 0;
            var temp = (destinationMask << 4) & this.blackPieces;
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
                var whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                var blackPieces = this.blackPieces ^ temp;
                var kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                var canJumpAgain = !(destinationMask & 0xF) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                var player = canJumpAgain ? game_model_1.Player.One : game_model_1.Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == game_model_1.Player.Two) {
            var canJump = void 0;
            var temp = (destinationMask >>> 4) & this.whitePieces;
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
                var whitePieces = this.whitePieces ^ temp;
                var blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                var kings = (this.kings & sourceMask) ?
                    (this.kings | destinationMask) ^ sourceMask :
                    this.kings | (destinationMask & 0xF0000000);
                if (kings & temp) {
                    kings = kings ^ temp;
                }
                var canJumpAgain = !(destinationMask & 0xF0000000) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                var player = canJumpAgain ? game_model_1.Player.Two : game_model_1.Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    };
    Bitboard.prototype.tryMove = function (move) {
        var failureResult = { success: false };
        var sourceMask = S[move.source];
        var destinationMask = S[move.destination];
        var isKing = sourceMask & this.kings;
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
        var jumpers = this.player == game_model_1.Player.One ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            var shouldJump = jumpers & sourceMask;
            if (shouldJump) {
                return this.tryJump(move.source, move.destination);
            }
            else {
                failureResult.message = 'Player should jump';
                return failureResult;
            }
        }
        return this.tryStep(move.source, move.destination);
    };
    Bitboard.prototype.toString = function () {
        var _this = this;
        var buffer = [];
        var prependSpace = false;
        var getPieceString = function (index) {
            var mask = S[index];
            var pieceString = '__';
            if (mask & _this.blackPieces) {
                pieceString = (mask & _this.kings) ? 'BK' : 'BP';
            }
            else if (mask & _this.whitePieces) {
                pieceString = (mask & _this.kings) ? 'WK' : 'WP';
            }
            return pieceString;
        };
        for (var i = 0; i < exports.SQUARE_COUNT; i += 4) {
            var lineBuffer = [];
            for (var j = i; j < i + 4; j++) {
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
    };
    return Bitboard;
}());
exports.Bitboard = Bitboard;
