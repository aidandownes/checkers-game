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
    constructor() {
        this.whitePieces = 0xFFF00000;
        this.blackPieces = 0x00000FFF;
        this.kings = 0;
        this.player = Player.White;
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
    getMoversWhite() {
        if (this.player != Player.White) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const whiteKings = this.whitePieces | this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied && MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied && MASK_L5) << 5) & this.blackPieces;
        if (whiteKings) {
            movers |= (notOccupied >> 4) & whiteKings;
            movers |= ((notOccupied && MASK_R3) >> 3) & whiteKings;
            movers |= ((notOccupied && MASK_R5) >> 5) & whiteKings;
        }
        return movers;
    }
}
exports.Bitboard = Bitboard;
