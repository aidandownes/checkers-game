/// <reference path="../typings/browser.d.ts" />
import {CheckersModule} from './checkers-module';
import {Checkers, ComputeOptions, Player} from './checkers-service';

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
    isSettingsDirty: boolean;
    
    constructor(private checkers: Checkers, 
            private $mdSidenav: ng.material.ISidenavService,
            private $scope: ng.IScope, private $mdDialog: ng.material.IDialogService) {
        this.computeOptions = checkers.computeOptions;
        
        $scope.$watchCollection(() => this.computeOptions, (newValue, oldValue) => {
            checkers.computeOptions = newValue;
            this.isSettingsDirty = !!oldValue;
        });
        
        $scope.$watch(() => this.isSidenavOpen, (newValue, oldValue) => {
            if (!newValue && oldValue && this.isSettingsDirty) {
                // Side nav was closed. Reset game.
                this.checkers.reset();
            }
            this.isSettingsDirty = false;
        });
        
        // Check for new winner
        $scope.$watch(() => this.checkers.getWinner(), this.onWinner.bind(this));
    }
    
    onWinner(player: Player) {
        if (player == this.checkers.humanPlayer) {
            this.showGameOverDialog(true);  
        } else if (player == this.checkers.computerPlayer) {
            this.showGameOverDialog(false);  
        }
    }
    
    showGameOverDialog(winner:boolean) {
        var confirmDetails = this.$mdDialog.confirm()
            .title('Game Over')
            .textContent(winner ? 'You won!!' : 'You lost ?!!')
            .ariaLabel('Game over')
            .ok('New Game');
        this.$mdDialog.show(confirmDetails).then(() => {
            this.restart();
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
