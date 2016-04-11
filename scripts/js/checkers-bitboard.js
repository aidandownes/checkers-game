"use strict";
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
(function (Player) {
    Player[Player["None"] = 0] = "None";
    Player[Player["White"] = 1] = "White";
    Player[Player["Black"] = 2] = "Black";
})(exports.Player || (exports.Player = {}));
var Player = exports.Player;
exports.SQUARE_COUNT = 32;
class Bitboard {
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = Player.White) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == Player.White) {
            let canPlay = this.getJumpersWhite() || this.getSteppersWhite();
            this.winner = canPlay ? Player.None : Player.Black;
        }
        else {
            let canPlay = this.getJumpersBlack() || this.getSteppersBlack();
            this.winner = canPlay ? Player.None : Player.White;
        }
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return Player.White;
        }
        else if (this.blackPieces & mask) {
            return Player.Black;
        }
        else {
            return Player.None;
        }
    }
    getSteppersWhite() {
        if (this.player != Player.White) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >> 5) & kingPieces;
        }
        return movers;
    }
    getSteppersBlack() {
        if (this.player != Player.Black) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        let movers = (notOccupied >> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied >> 4) & kingPieces;
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
        let movers = 0;
        let temp = (notOccupied << 4) & blackPieces;
        movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & whitePieces;
        temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & blackPieces;
        movers |= (temp << 4) & whitePieces;
        if (kingPieces) {
            temp = (notOccupied >> 4) & blackPieces;
            movers |= (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & kingPieces;
            temp = (((notOccupied & MASK_R3) >> 3) | ((notOccupied & MASK_R5) >> 5)) & blackPieces;
            movers |= (temp >> 4) & kingPieces;
        }
        return movers;
    }
    getJumpersBlack(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = blackPieces & kings;
        let movers = 0;
        let temp = (notOccupied >> 4) & whitePieces;
        movers |= (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & blackPieces;
        temp = (((notOccupied & MASK_R3) >> 3) | ((notOccupied & MASK_R5) >> 5)) & whitePieces;
        movers |= (temp >> 4) & blackPieces;
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
        if (this.player == Player.White) {
            let canMove = (destinationMask << 4) & sourceMask;
            canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
            canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >> 4) & sourceMask;
                canMove |= ((destinationMask & MASK_R3) >> 3) & sourceMask;
                canMove |= ((destinationMask & MASK_R5) >> 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces;
                let kings = isKing ? (this.kings | destinationMask) ^ sourceMask : this.kings | (destinationMask & 0xF);
                let player = Player.Black;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player = Player.Black) {
            let canMove = (destinationMask >> 4) & sourceMask;
            canMove |= ((destinationMask & MASK_R3) >> 3) & sourceMask;
            canMove |= ((destinationMask & MASK_R5) >> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = this.whitePieces;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask & 0xF0000000);
                let player = Player.White;
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
        if (this.player == Player.White) {
            let canJump;
            let temp = (destinationMask << 4) & this.blackPieces;
            canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask >> 4) & this.blackPieces;
                canJump = (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_R3) >> 3) | ((destinationMask & MASK_R5) >> 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (canJump) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces ^ temp;
                let kings = this.kings | (destinationMask & 0xF);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.White : Player.Black;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == Player.Black) {
            let canJump;
            let temp = (destinationMask >> 4) & this.whitePieces;
            canJump = (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_R3) >> 3) | ((destinationMask & MASK_R5) >> 5)) & this.whitePieces;
                canJump = (temp >> 4) & sourceMask;
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
                let kings = this.kings | (destinationMask & 0xF0000000);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.Black : Player.White;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryMove(source, destination) {
        const failureResult = { success: false };
        const sourceMask = S[source];
        const destinationMask = S[destination];
        const isKing = sourceMask & this.kings;
        if (this.winner != Player.None) {
            return failureResult;
        }
        if (this.player != this.getPlayerAtSquare(source)) {
            return failureResult;
        }
        if (this.getPlayerAtSquare(destination) != Player.None) {
            return failureResult;
        }
        let jumpers = this.player == Player.White ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            return (jumpers & sourceMask) ?
                this.tryJump(source, destination) :
                failureResult;
        }
        let steppers = this.player == Player.White ?
            this.getSteppersWhite() :
            this.getSteppersBlack();
        if (steppers) {
            return (steppers & sourceMask) ?
                this.tryStep(source, destination) :
                failureResult;
        }
        return failureResult;
    }
}
exports.Bitboard = Bitboard;
