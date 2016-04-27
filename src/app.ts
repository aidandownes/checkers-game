/// <reference path="../typings/browser.d.ts" />
import {CheckersModule} from './checkers-module';
import {Checkers} from './checkers-service';

export const AppModule = angular.module('app', [CheckersModule.name, 'ngMaterial']);


function configureThemes($mdThemingProvider:ng.material.IThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('blue')
        .accentPalette('deep-orange')
        .backgroundPalette('grey', {
            'default': '50'
        });
        
   $mdThemingProvider.theme('card-default')
        .backgroundPalette('grey');
        
   $mdThemingProvider.theme('card-blue-dark')
        .backgroundPalette('blue')
        .dark();
        
   $mdThemingProvider.theme('card-red')
        .backgroundPalette('red')
        .dark();
}

AppModule.config(configureThemes);


class AppController {
    constructor(private checkers: Checkers) {
        
    }
}
