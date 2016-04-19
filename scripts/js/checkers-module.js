"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
const checkers_game_stats_1 = require('./checkers-game-stats');
exports.CheckersModule = angular.module('Checkers', []);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
exports.CheckersModule.component('checkersGameStats', checkers_game_stats_1.CheckersGameStats);
exports.CheckersModule.filter('timeFilter', checkers_game_stats_1.TimeFormatFilter);
