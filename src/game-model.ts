/**
 * Represents a game player.
 */
export enum Player {
    None,
    One,
    Two
}

/**
 * Represents a game result.
 */
export enum Result {
    Win,
    Lose,
    Draw
}

/**
 * Represents a move in game.
 */
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
     * @return The current player.
     */
    getPlayerToMove(): Player;
    
    /** 
     * Gets the opponent.
     * @param player The player whose opponent is returned.
     */
    getOpponent(player: Player): Player;
}
