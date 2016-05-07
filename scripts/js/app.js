"use strict";
var checkers_module_1 = require('./checkers-module');
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
var AppController = (function () {
    function AppController(checkers, $mdSidenav, $scope) {
        var _this = this;
        this.checkers = checkers;
        this.$mdSidenav = $mdSidenav;
        this.$scope = $scope;
        this.computeOptions = checkers.computeOptions;
        $scope.$watchCollection(function () { return _this.computeOptions; }, function (newValue, oldValue) {
            checkers.computeOptions = newValue;
            _this.isSettingsDirty = !!oldValue;
        });
        $scope.$watch(function () { return _this.isSidenavOpen; }, function (newValue, oldValue) {
            if (!newValue && oldValue && _this.isSettingsDirty) {
                _this.checkers.reset();
            }
            _this.isSettingsDirty = false;
        });
    }
    AppController.prototype.toggleMenu = function () {
        this.$mdSidenav('left').toggle();
    };
    AppController.prototype.restart = function () {
        this.checkers.reset();
    };
    return AppController;
}());
exports.AppModule.controller('AppController', AppController);
