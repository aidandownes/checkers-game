/// <reference path="../typings/browser.d.ts" />
import {GameState, Move, Result, Player} from './mcts';
import * as Asserts from './assert';

export {Player} from './mcts';

const S = (function (): number[] {
    let squares: number[] = []
    for (let i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();

const MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
const MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
const MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
const MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];


export const SQUARE_COUNT = 32;

export interface MoveResult {
    success: boolean;
    board?: Bitboard;
    message?: string;
}

export interface CheckersMove extends Move {
    source: number;
    destination: number;
    player: Player;
}

export class Bitboard implements GameState {
    winner: Player;
    private moves: CheckersMove[];

    constructor(public whitePieces: number = 0xFFF00000,
        public blackPieces: number = 0x00000FFF, public kings: number = 0,
        public player: Player = Player.One) {
            
        if (this.player == Player.One) {
            let canPlay = this.getJumpersWhite() || this.getHoppersWhite();
            this.winner = canPlay ? Player.None : Player.Two;
        } else {
            let canPlay = this.getJumpersBlack() || this.getHoppersBlack();
            this.winner = canPlay ? Player.None : Player.One;
        }
        Asserts.assert((blackPieces & whitePieces) == 0);
    }

    doMove(move: CheckersMove): Bitboard {
        let result = this.tryMove(move);
        Asserts.assert(result.success, 'Move was not succesful');
        return result.board;
    }

    doRandomMove(): Bitboard {
        let moves = this.getMoves();
        Asserts.assertNotEmpty(moves);
        let randomMoveIndex = Math.floor(Math.random() * moves.length);
        return this.doMove(moves[randomMoveIndex]);
    }

    hasMoves(): boolean {
        return this.getMoves().length > 0;
    }

    getMoves(): CheckersMove[] {
        if (!this.moves) {
            this.moves = [];
            
            for (let i = 0; i < SQUARE_COUNT; i++) {
                if (this.getPlayerAtSquare(i) != this.player) {
                    continue;
                }
                Array.prototype.push.apply(this.moves, this.getJumpMoves(i));
            }
            
            if (this.moves.length == 0) {
                for (let i = 0; i < SQUARE_COUNT; i++) {
                    if (this.getPlayerAtSquare(i) != this.player) {
                        continue;
                    }
                    Array.prototype.push.apply(this.moves, this.getHopMoves(i));
                }
            }
        }

        return this.moves;
    }


    getResult(player: Player): Result {
        Asserts.assert(this.winner == Player.One || this.winner == Player.Two);
        return this.winner == player ? Result.Win : Result.Lose;
    }

    getPlayerToMove(): Player {
        return this.player;
    }

    getPlayerAtSquare(square: number): Player {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return Player.One;
        } else if (this.blackPieces & mask) {
            return Player.Two;
        } else {
            return Player.None;
        }
    }

    private getHopMoves(source: number): CheckersMove[] {
        let moves: CheckersMove[] = [];
        
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        let hops = 0;

        if (isKing || (player == Player.One)) {
            hops |= (mask >>> 4) & notOccupied;
            hops |= ((mask & MASK_R3) >>> 3) & notOccupied;
            hops |= ((mask & MASK_R5) >>> 5) & notOccupied;
        }

        if (isKing || (player == Player.Two)) {
            hops |= (mask << 4) & notOccupied;
            hops |= ((mask & MASK_L3) << 3) & notOccupied;
            hops |= ((mask & MASK_L5) << 5) & notOccupied;
        }

        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & hops) {
                moves.push({ source, destination, player });
            }
        }

        return moves;
    }

    private getJumpMoves(source: number): CheckersMove[] {
        let moves: CheckersMove[] = [];
        const mask = S[source];
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const isKing = mask & this.kings;
        const player = this.player;
        let jumps = 0;

        let rightJump = (opponentPieces: number) => {
            let temp = (mask >>> 4) & opponentPieces;
            jumps |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & notOccupied;
            temp = (((mask & MASK_R3) >>> 3) | ((mask & MASK_R5) >>> 5)) & opponentPieces;
            jumps |= (temp >>> 4) & notOccupied;
        }

        let leftJump = (opponentPieces: number) => {
            let temp = (mask << 4) & opponentPieces;
            jumps |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & notOccupied;
            temp = (((mask & MASK_L3) << 3) | ((mask & MASK_L5) << 5)) & opponentPieces;
            jumps |= (temp << 4) & notOccupied;
        }

        if (player == Player.One) {
            rightJump(this.blackPieces);
            if (isKing) {
                leftJump(this.blackPieces);
            }
        } else if (player == Player.Two) {
            leftJump(this.whitePieces);
            if (isKing) {
                rightJump(this.whitePieces);
            }
        }

        for (let destination = 0; destination < 32; destination++) {
            if (S[destination] & jumps) {
                moves.push({ source, destination, player });
            }
        }

        return moves;
    }


    getHoppersWhite(): number {
        // If its not white's turn. Then no move.
        if (this.player != Player.One) {
            return 0;
        }

        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >>> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >>> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >>> 5) & kingPieces;
        }
        return movers;
    }

    getHoppersBlack(): number {
        // If its not black's turn. Then no move.
        if (this.player != Player.Two) {
            return 0;
        }

        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        let movers = (notOccupied >>> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >>> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >>> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied << 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    }

    private getJumpersWhite(whitePieces?: number, blackPieces?: number, kings?: number): number {
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
            temp = (notOccupied >>> 4) & blackPieces;
            movers |= (((temp & MASK_R3) >>> 3) | ((temp & MASK_R5) >>> 5)) & kingPieces;
            temp = (((notOccupied & MASK_R3) >>> 3) | ((notOccupied & MASK_R5) >>> 5)) & blackPieces;
            movers |= (temp >>> 4) & kingPieces;
        }

        return movers;
    }

    private getJumpersBlack(whitePieces?: number, blackPieces?: number, kings?: number): number {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = blackPieces & kings;
        let movers = 0;
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

    /** 
     * Attempt step.
     */
    private tryStep(source: number, destination: number): MoveResult {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;

        if (this.player == Player.One) {
            let canMove = (destinationMask << 4) & sourceMask;
            canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
            canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >>> 4) & sourceMask;
                canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
                canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            }

            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces
                let kings = isKing ? (this.kings | destinationMask) ^ sourceMask : this.kings | (destinationMask & 0xF)
                let player = Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        } else if (this.player = Player.Two) {
            let canMove = (destinationMask >>> 4) & sourceMask;
            canMove |= ((destinationMask & MASK_R3) >>> 3) & sourceMask;
            canMove |= ((destinationMask & MASK_R5) >>> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            }

            if (canMove) {
                let whitePieces = this.whitePieces
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask & 0xF0000000);
                let player = Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }

        return { success: false };
    }

    private tryJump(source: number, destination: number): MoveResult {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;

        if (this.player == Player.One) {
            let canJump: number;
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
                let kings = this.kings | (destinationMask & 0xF);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.One : Player.Two;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        } else if (this.player == Player.Two) {
            let canJump: number;
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
                let kings = this.kings | (destinationMask & 0xF0000000);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.Two : Player.One;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }

        return { success: false };
    }

    tryMove(move: CheckersMove): MoveResult {
        const failureResult:MoveResult = { success: false };
        const sourceMask = S[move.source];
        const destinationMask = S[move.destination];
        const isKing = sourceMask & this.kings;

        // Check if game is over 
        if (this.winner != Player.None) {
            failureResult.message = 'Game is over';
            return failureResult;
        }

        // Check if correct player is moving.
        if (this.player != this.getPlayerAtSquare(move.source)) {
            failureResult.message = 'Wrong player move';
            return failureResult;
        }

        // Check if destination is empty.
        if (this.getPlayerAtSquare(move.destination) != Player.None) {
            failureResult.message = 'Destination is not empty';
            return failureResult;
        }

        let jumpers = this.player == Player.One ?
            this.getJumpersWhite() :
            this.getJumpersBlack();

        // Check if player has a jump option.
        if (jumpers) {
            let shouldJump = jumpers & sourceMask;
            if (shouldJump) {
                return this.tryJump(move.source, move.destination);
            } else {
                failureResult.message = 'Player should jump';
                return failureResult;
            }
        }
        
        return this.tryStep(move.source, move.destination);
    }
    
    toString():string {
        let buffer:string[] = [];
        let prependSpace = false;
        
        let getPieceString = (index:number) => {
            let mask = S[index];
            let pieceString = '__';
            if (mask & this.blackPieces) {
                pieceString = (mask & this.kings) ? 'BK' : 'BP';
            } else if (mask & this.whitePieces) {
                pieceString =  (mask & this.kings) ? 'WK' : 'WP';
            }
            return pieceString;
        };
        
        for (let i = 0; i < SQUARE_COUNT; i += 4) {
            let lineBuffer : string[] = [];
            for (let j = i; j <  i + 4; j++) {
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