System.register(['./checkers'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var checkers_1;
    var AppModule, CANVAS_ID;
    return {
        setters:[
            function (checkers_1_1) {
                checkers_1 = checkers_1_1;
            }],
        execute: function() {
            exports_1("AppModule", AppModule = angular.module('AppModule', [checkers_1.CheckersModule.name]));
            CANVAS_ID = 'board';
            AppModule.config(['checkersProvider', function (checkersProvider) {
                    checkersProvider.setCanvasId(CANVAS_ID);
                }]);
            AppModule.run(['checkers', function (checkers) {
                    checkers.run();
                }]);
        }
    }
});
