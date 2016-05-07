"use strict";
var game_model_1 = require('./game-model');
var GameStatsController = (function () {
    function GameStatsController(checkers, $interval) {
        var _this = this;
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(function () {
            var endTime = new Date();
            _this.playTime = (endTime.getTime() - _this.checkers.startTime) / 1000;
        }, 1000);
    }
    GameStatsController.prototype.getCurrentPlayer = function () {
        switch (this.checkers.getCurrentPlayer()) {
            case game_model_1.Player.One:
                return 'White';
            case game_model_1.Player.Two:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    };
    GameStatsController.prototype.undoMove = function () {
        return false;
    };
    GameStatsController.prototype.getPlayTime = function () {
        return this.playTime;
    };
    return GameStatsController;
}());
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        var seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        var minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        var hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        var days = value;
        if (days) {
            return days + " days, " + hours + " hrs, " + minutes + " mins, " + seconds + " secs";
        }
        else if (hours) {
            return hours + " hrs, " + minutes + " mins, " + seconds + " secs";
        }
        else if (minutes) {
            return minutes == 1 ? minutes + " mins, " + seconds + " secs" : minutes + " mins, " + seconds + " secs";
        }
        else {
            return seconds + " secs";
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameStats = {
    templateUrl: 'templates/game-stats.ng',
    controller: GameStatsController
};
