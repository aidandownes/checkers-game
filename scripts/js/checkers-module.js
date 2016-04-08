"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
exports.CheckersModule = angular.module('Checkers', []);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
