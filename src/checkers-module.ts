/// <reference path="../typings/browser.d.ts" />

import {CheckersProvider} from './checkers-service';
import {CheckersBoard} from './checkers-board';
import {CheckersGameStats, TimeFormatFilter} from './checkers-game-stats';
import {CheckersMctsStats} from './checkers-mcts-stats';
import {UctSearchModule} from './uct';

export const CheckersModule = angular.module('Checkers', [UctSearchModule.name]);

CheckersModule.provider('checkers', CheckersProvider);
CheckersModule.component('checkersBoard', CheckersBoard);
CheckersModule.component('checkersGameStats', CheckersGameStats);
CheckersModule.component('checkersMctsStats', CheckersMctsStats);
CheckersModule.filter('timeFilter', TimeFormatFilter);