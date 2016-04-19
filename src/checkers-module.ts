/// <reference path="../typings/browser.d.ts" />

import {CheckersProvider} from './checkers-service';
import {CheckersBoard} from './checkers-board';
import {CheckersGameStats, TimeFormatFilter} from './checkers-game-stats';

export const CheckersModule = angular.module('Checkers', []);

CheckersModule.provider('checkers', CheckersProvider);
CheckersModule.component('checkersBoard', CheckersBoard);
CheckersModule.component('checkersGameStats', CheckersGameStats);
CheckersModule.filter('timeFilter', TimeFormatFilter);