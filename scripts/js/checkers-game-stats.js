"use strict";
const game_model_1 = require('./game-model');
class GameStatsController {
    constructor(checkers, $interval) {
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(() => {
            let endTime = new Date();
            this.playTime = (endTime.getTime() - this.checkers.startTime) / 1000;
        }, 1000);
    }
    getCurrentPlayer() {
        switch (this.checkers.currentPlayer) {
            case game_model_1.Player.One:
                return 'White';
            case game_model_1.Player.Two:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }
    undoMove() {
        return false;
    }
    getPlayTime() {
        return this.playTime;
    }
}
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        let seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        let minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        let hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        let days = value;
        if (days) {
            return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (hours) {
            return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (minutes) {
            return minutes == 1 ? `${minutes} mins, ${seconds} secs` : `${minutes} mins, ${seconds} secs`;
        }
        else {
            return `${seconds} secs`;
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameStats = {
    templateUrl: './templates/game-stats.ng',
    controller: GameStatsController
};
