/// <reference path="../typings/browser.d.ts" />
import {CheckersModule, CheckersProvider, Checkers} from './checkers';

export const AppModule = angular.module('AppModule', [CheckersModule.name]);

const CANVAS_ID = 'board';

AppModule.config(['checkersProvider', function(checkersProvider:CheckersProvider) {
    checkersProvider.setCanvasId(CANVAS_ID);
}]);

AppModule.run(['checkers', function(checkers:Checkers) {
    checkers.run();
}]);