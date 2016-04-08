/// <reference path="../typings/browser.d.ts" />
import {CheckersModule, CheckersProvider, Checkers} from './checkers';

export const AppModule = angular.module('app', [CheckersModule.name]);
