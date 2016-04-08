/// <reference path="../typings/browser.d.ts" />

import {CheckersProvider} from './checkers-service';
import {CheckersBoard} from './checkers-board';

export const CheckersModule = angular.module('Checkers', []);

CheckersModule.provider('checkers', CheckersProvider);
CheckersModule.component('checkersBoard', CheckersBoard);