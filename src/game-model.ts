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
    
    getOpponent(player: Player): Player;
}
