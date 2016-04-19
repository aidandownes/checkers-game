/// <reference path="../typings/browser.d.ts" />
import {CheckersModule} from './checkers-module';

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
}

AppModule.config(configureThemes);
