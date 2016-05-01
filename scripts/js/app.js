"use strict";
const checkers_module_1 = require('./checkers-module');
exports.AppModule = angular.module('app', [checkers_module_1.CheckersModule.name, 'ngMaterial']);
function configureThemes($mdThemingProvider) {
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
exports.AppModule.config(configureThemes);
class AppController {
    constructor(checkers, $mdSidenav, $scope) {
        this.checkers = checkers;
        this.$mdSidenav = $mdSidenav;
        this.$scope = $scope;
        this.computeOptions = checkers.computeOptions;
        $scope.$watchCollection(() => this.computeOptions, (newValue, oldValue) => {
            checkers.computeOptions = newValue;
            this.isSettingsDirty = !!oldValue;
        });
        $scope.$watch(() => this.isSidenavOpen, (newValue, oldValue) => {
            if (!newValue && oldValue && this.isSettingsDirty) {
                this.checkers.reset();
            }
            this.isSettingsDirty = false;
        });
    }
    toggleMenu() {
        this.$mdSidenav('left').toggle();
    }
    restart() {
        this.checkers.reset();
    }
}
exports.AppModule.controller('AppController', AppController);
