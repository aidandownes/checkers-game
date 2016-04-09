/// <reference path="../typings/browser.d.ts" />

const S = (function(): number[] {
    let squares: number[] = []
    for(let i = 0; i < 32; i++) {
         squares.push(1 << i);
    }
    return squares;
})();

const MASK_L3 = S[ 1] | S[ 2] | S[ 3] | S[ 9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
const MASK_L5 = S[ 4] | S[ 5] | S[ 6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
const MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[ 4] | S[ 5] | S[ 6];
const MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[ 9] | S[10] | S[11];

export enum Player {
    None,
    White, 
    Black
}

export const SQUARE_COUNT = 32;

export class Bitboard {
    constructor(public whitePieces:number = 0xFFF00000, 
            public blackPieces:number = 0x00000FFF, public kings:number = 0,
            public player:Player = Player.White) {
    }
    
    getPlayerAtSquare(square:number) : Player {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return Player.White;
        } else if (this.blackPieces & mask) {
            return Player.Black;
        } else {
            return Player.None;
        }
    }
    
    getMoversWhite(): number {
        // If its not white's turn. Then no move.
        if (this.player != Player.White) {
            return 0;
        }
        
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const whiteKings = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied && MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied && MASK_L5) << 5) & this.whitePieces;
        if (whiteKings) {
            movers |= (notOccupied >> 4) & whiteKings;
            movers |= ((notOccupied && MASK_R3) >> 3) & whiteKings;
            movers |= ((notOccupied && MASK_R5) >> 5) & whiteKings;
        }
        return movers;
    }
    
    move(source:number, destination:number): Bitboard {
        // Check if correct player is moving.
        if (this.player != this.getPlayerAtSquare(source)) {
            return this;
        }
        
        // Check if destination is empty.
        if (this.getPlayerAtSquare(destination) != Player.None) {
            return this;
        }
        
        let sourceMask = S[source];
        let destinationMask = S[destination];
        
        // Check if can move to destination
        if (this.player == Player.White) {
            let isKing = sourceMask & this.kings;
            let canMove = (destinationMask << 4) & sourceMask;
            canMove |= (destinationMask && MASK_L3 << 3) & sourceMask;
            canMove |= (destinationMask && MASK_L5 << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >> 4) & sourceMask;
                canMove |= ((destinationMask && MASK_R3) >> 3) & sourceMask;
                canMove |= ((destinationMask && MASK_R5) >> 5) & sourceMask;
            }
            
            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces
                let kings = this.kings | (destinationMask && 0xF);
                let player = Player.Black;
                return new Bitboard(whitePieces, blackPieces, kings, player);
            }
        } else if (this.player = Player.Black) {
            let isKing = sourceMask & this.kings;
            let canMove = (destinationMask >> 4) & sourceMask;
            canMove |= (destinationMask && MASK_R3 >> 3) & sourceMask;
            canMove |= (destinationMask && MASK_R5 >> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask && MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask && MASK_L5) << 5) & sourceMask;
            }
            
            if (canMove) {
                let whitePieces = this.whitePieces
                let blackPieces =(this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask && 0xF0000000);
                let player = Player.White;
                return new Bitboard(whitePieces, blackPieces, kings, player);
            }
        }
        
        throw new Error('Not implemented');
    }
}