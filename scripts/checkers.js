System.register([], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var CheckersModule, SQUARE_SIZE, ROW_LENGTH, COLUMN_LENGTH, Color, Checkers, CheckersProvider;
    function toFillStyle(color) {
        switch (color) {
            case Color.Red:
                return 'red';
            case Color.Black:
                return 'black';
            default:
                throw new Error('Unknown color');
        }
    }
    return {
        setters:[],
        execute: function() {
            exports_1("CheckersModule", CheckersModule = angular.module('Checkers', []));
            SQUARE_SIZE = 100;
            ROW_LENGTH = 8;
            COLUMN_LENGTH = 8;
            (function (Color) {
                Color[Color["Black"] = 0] = "Black";
                Color[Color["Red"] = 1] = "Red";
            })(Color || (Color = {}));
            class Checkers {
                constructor(canvasId, $document, $window) {
                    this.$document = $document;
                    this.$window = $window;
                    let canvasElement = document.getElementById(canvasId);
                    this.ctx = canvasElement.getContext('2d');
                }
                render() {
                    this.drawBoard();
                }
                drawSquare(x, y, color) {
                    this.ctx.fillStyle = toFillStyle(color);
                    this.ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
                }
                drawBoard() {
                    let x = 0;
                    let y = 0;
                    for (let i = 0; i <= ROW_LENGTH; i++) {
                        let x = i * SQUARE_SIZE;
                        let color = i % 2 ? Color.Red : Color.Black;
                        for (let j = 0; j <= COLUMN_LENGTH; j++) {
                            let y = j * SQUARE_SIZE;
                            this.drawSquare(x, y, color);
                            color = Color.Red == color ? Color.Black : Color.Red;
                        }
                    }
                }
                run() {
                    this.render();
                    this.$window.requestAnimationFrame(this.run);
                }
            }
            exports_1("Checkers", Checkers);
            class CheckersProvider {
                setCanvasId(canvasId) {
                    this.canvasId = canvasId;
                }
                $get($injector) {
                    return $injector.instantiate(Checkers, { canvasId: this.canvasId });
                }
            }
            exports_1("CheckersProvider", CheckersProvider);
            CheckersModule.provider('checkers', CheckersProvider);
        }
    }
});
