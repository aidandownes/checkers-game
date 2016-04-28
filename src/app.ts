/// <reference path="../typings/browser.d.ts" />
import {CheckersModule} from './checkers-module';
import {Checkers, ComputeOptions} from './checkers-service';

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
    computeOptions: ComputeOptions;
    isSidenavOpen: boolean;
    
    constructor(private checkers: Checkers, 
            private $mdSidenav: ng.material.ISidenavService,
            private $scope: ng.IScope) {
        this.computeOptions = checkers.getComputeOptions();
        
        $scope.$watchCollection(() => this.computeOptions, (options) => {
            checkers.setComputeOptions(options);
        });
        
        $scope.$watch(() => this.isSidenavOpen, (newValue, oldValue) => {
            if (!newValue && oldValue) {
                // Side nav was closed. Reset game.
                this.checkers.reset();
            }
        });
    }
    
    toggleMenu(){
        this.$mdSidenav('left').toggle();
    }
    
    restart() {
        this.checkers.reset();
    }
}


AppModule.controller('AppController', AppController);
