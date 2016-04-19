(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
const checkers_module_1 = require('./checkers-module');
exports.AppModule = angular.module('app', [checkers_module_1.CheckersModule.name, 'ngMaterial']);

},{"./checkers-module":6}],2:[function(require,module,exports){
"use strict";
const S = (function () {
    let squares = [];
    for (let i = 0; i < 32; i++) {
        squares.push(1 << i);
    }
    return squares;
})();
const MASK_L3 = S[1] | S[2] | S[3] | S[9] | S[10] | S[11] | S[17] | S[18] | S[19] | S[25] | S[26] | S[27];
const MASK_L5 = S[4] | S[5] | S[6] | S[12] | S[13] | S[14] | S[20] | S[21] | S[22];
const MASK_R3 = S[28] | S[29] | S[30] | S[20] | S[21] | S[22] | S[12] | S[13] | S[14] | S[4] | S[5] | S[6];
const MASK_R5 = S[25] | S[26] | S[27] | S[17] | S[18] | S[19] | S[9] | S[10] | S[11];
(function (Player) {
    Player[Player["None"] = 0] = "None";
    Player[Player["White"] = 1] = "White";
    Player[Player["Black"] = 2] = "Black";
})(exports.Player || (exports.Player = {}));
var Player = exports.Player;
exports.SQUARE_COUNT = 32;
class Bitboard {
    constructor(whitePieces = 0xFFF00000, blackPieces = 0x00000FFF, kings = 0, player = Player.White) {
        this.whitePieces = whitePieces;
        this.blackPieces = blackPieces;
        this.kings = kings;
        this.player = player;
        if (this.player == Player.White) {
            let canPlay = this.getJumpersWhite() || this.getSteppersWhite();
            this.winner = canPlay ? Player.None : Player.Black;
        }
        else {
            let canPlay = this.getJumpersBlack() || this.getSteppersBlack();
            this.winner = canPlay ? Player.None : Player.White;
        }
    }
    getPlayerAtSquare(square) {
        const mask = S[square];
        if (this.whitePieces & mask) {
            return Player.White;
        }
        else if (this.blackPieces & mask) {
            return Player.Black;
        }
        else {
            return Player.None;
        }
    }
    getSteppersWhite() {
        if (this.player != Player.White) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.whitePieces & this.kings;
        let movers = (notOccupied << 4) & this.whitePieces;
        movers |= ((notOccupied & MASK_L3) << 3) & this.whitePieces;
        movers |= ((notOccupied & MASK_L5) << 5) & this.whitePieces;
        if (kingPieces) {
            movers |= (notOccupied >> 4) & kingPieces;
            movers |= ((notOccupied & MASK_R3) >> 3) & kingPieces;
            movers |= ((notOccupied & MASK_R5) >> 5) & kingPieces;
        }
        return movers;
    }
    getSteppersBlack() {
        if (this.player != Player.Black) {
            return 0;
        }
        const notOccupied = ~(this.whitePieces | this.blackPieces);
        const kingPieces = this.blackPieces & this.kings;
        let movers = (notOccupied >> 4) & this.blackPieces;
        movers |= ((notOccupied & MASK_R3) >> 3) & this.blackPieces;
        movers |= ((notOccupied & MASK_R5) >> 5) & this.blackPieces;
        if (kingPieces) {
            movers |= (notOccupied >> 4) & kingPieces;
            movers |= ((notOccupied & MASK_L3) << 3) & kingPieces;
            movers |= ((notOccupied & MASK_L5) << 5) & kingPieces;
        }
        return movers;
    }
    getJumpersWhite(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = whitePieces & kings;
        let movers = 0;
        let temp = (notOccupied << 4) & blackPieces;
        movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & whitePieces;
        temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & blackPieces;
        movers |= (temp << 4) & whitePieces;
        if (kingPieces) {
            temp = (notOccupied >> 4) & blackPieces;
            movers |= (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & kingPieces;
            temp = (((notOccupied & MASK_R3) >> 3) | ((notOccupied & MASK_R5) >> 5)) & blackPieces;
            movers |= (temp >> 4) & kingPieces;
        }
        return movers;
    }
    getJumpersBlack(whitePieces, blackPieces, kings) {
        whitePieces = whitePieces || this.whitePieces;
        blackPieces = blackPieces || this.blackPieces;
        kings = kings || this.kings;
        const notOccupied = ~(whitePieces | blackPieces);
        const kingPieces = blackPieces & kings;
        let movers = 0;
        let temp = (notOccupied >> 4) & whitePieces;
        movers |= (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & blackPieces;
        temp = (((notOccupied & MASK_R3) >> 3) | ((notOccupied & MASK_R5) >> 5)) & whitePieces;
        movers |= (temp >> 4) & blackPieces;
        if (kingPieces) {
            temp = (notOccupied << 4) & whitePieces;
            movers |= (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & kingPieces;
            temp = (((notOccupied & MASK_L3) << 3) | ((notOccupied & MASK_L5) << 5)) & whitePieces;
            movers |= (temp << 4) & kingPieces;
        }
        return movers;
    }
    tryStep(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
        if (this.player == Player.White) {
            let canMove = (destinationMask << 4) & sourceMask;
            canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
            canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask >> 4) & sourceMask;
                canMove |= ((destinationMask & MASK_R3) >> 3) & sourceMask;
                canMove |= ((destinationMask & MASK_R5) >> 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces;
                let kings = isKing ? (this.kings | destinationMask) ^ sourceMask : this.kings | (destinationMask & 0xF);
                let player = Player.Black;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player = Player.Black) {
            let canMove = (destinationMask >> 4) & sourceMask;
            canMove |= ((destinationMask & MASK_R3) >> 3) & sourceMask;
            canMove |= ((destinationMask & MASK_R5) >> 5) & sourceMask;
            if (isKing) {
                canMove |= (destinationMask << 4) & sourceMask;
                canMove |= ((destinationMask & MASK_L3) << 3) & sourceMask;
                canMove |= ((destinationMask & MASK_L5) << 5) & sourceMask;
            }
            if (canMove) {
                let whitePieces = this.whitePieces;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask & 0xF0000000);
                let player = Player.White;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryJump(source, destination) {
        let sourceMask = S[source];
        let destinationMask = S[destination];
        let isKing = sourceMask & this.kings;
        if (this.player == Player.White) {
            let canJump;
            let temp = (destinationMask << 4) & this.blackPieces;
            canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask >> 4) & this.blackPieces;
                canJump = (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_R3) >> 3) | ((destinationMask & MASK_R5) >> 5)) & this.blackPieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (canJump) {
                let whitePieces = (this.whitePieces | destinationMask) ^ sourceMask;
                let blackPieces = this.blackPieces ^ temp;
                let kings = this.kings | (destinationMask & 0xF);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersWhite(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.White : Player.Black;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        else if (this.player == Player.Black) {
            let canJump;
            let temp = (destinationMask >> 4) & this.whitePieces;
            canJump = (((temp & MASK_R3) >> 3) | ((temp & MASK_R5) >> 5)) & sourceMask;
            if (!canJump) {
                temp = (((destinationMask & MASK_R3) >> 3) | ((destinationMask & MASK_R5) >> 5)) & this.whitePieces;
                canJump = (temp >> 4) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (destinationMask << 4) & this.whitePieces;
                canJump = (((temp & MASK_L3) << 3) | ((temp & MASK_L5) << 5)) & sourceMask;
            }
            if (!canJump && isKing) {
                temp = (((destinationMask & MASK_L3) << 3) | ((destinationMask & MASK_L5) << 5)) & this.whitePieces;
                canJump = (temp << 4) & sourceMask;
            }
            if (canJump) {
                let whitePieces = this.whitePieces ^ temp;
                let blackPieces = (this.blackPieces | destinationMask) ^ sourceMask;
                let kings = this.kings | (destinationMask & 0xF0000000);
                let canJumpAgain = (kings == this.kings) &&
                    (this.getJumpersBlack(whitePieces, blackPieces, kings) & destinationMask);
                let player = canJumpAgain ? Player.Black : Player.White;
                return {
                    success: true,
                    board: new Bitboard(whitePieces, blackPieces, kings, player)
                };
            }
        }
        return { success: false };
    }
    tryMove(source, destination) {
        const failureResult = { success: false };
        const sourceMask = S[source];
        const destinationMask = S[destination];
        const isKing = sourceMask & this.kings;
        if (this.winner != Player.None) {
            return failureResult;
        }
        if (this.player != this.getPlayerAtSquare(source)) {
            return failureResult;
        }
        if (this.getPlayerAtSquare(destination) != Player.None) {
            return failureResult;
        }
        let jumpers = this.player == Player.White ?
            this.getJumpersWhite() :
            this.getJumpersBlack();
        if (jumpers) {
            return (jumpers & sourceMask) ?
                this.tryJump(source, destination) :
                failureResult;
        }
        let steppers = this.player == Player.White ?
            this.getSteppersWhite() :
            this.getSteppersBlack();
        if (steppers) {
            return (steppers & sourceMask) ?
                this.tryStep(source, destination) :
                failureResult;
        }
        return failureResult;
    }
}
exports.Bitboard = Bitboard;

},{}],3:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
const ROW_LENGTH = 8;
const COLUMN_LENGTH = 8;
const BoardSquareArray = (function () {
    let squares = [];
    for (let i = 0; i < ROW_LENGTH; i++) {
        let mod2 = i % 2;
        for (let j = 7 - mod2; j > 0 - mod2; j -= 2) {
            squares.push({ row: i, column: j });
        }
    }
    return squares.reverse();
})();
function toPosition(square, squareSize) {
    let boardSquare = BoardSquareArray[square];
    let x = boardSquare.column * squareSize;
    let y = boardSquare.row * squareSize;
    return { x: x, y: y };
}
function toSquare(position, squareSize) {
    var row = Math.floor(position.y / squareSize);
    var column = Math.floor(position.x / squareSize);
    return BoardSquareArray.findIndex(bs => bs.column == column && bs.row == row);
}
function add(p1, p2) {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    };
}
function subtract(p1, p2) {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    };
}
class CheckersBoardController {
    constructor(checkers, $element, $window, $timeout, $log) {
        this.checkers = checkers;
        this.$element = $element;
        this.$window = $window;
        this.$timeout = $timeout;
        this.$log = $log;
        let canvasElement = $element[0].querySelector('canvas');
        this.canvas = angular.element(canvasElement);
        this.ctx = canvasElement.getContext('2d');
        this.canvas.on("mousedown", this.handleMouseDown.bind(this));
    }
    $onInit() {
        this.squareSize = this.width / ROW_LENGTH;
    }
    $postLink() {
        this.render();
    }
    render() {
        this.$timeout(() => {
            this.drawBoard();
            this.drawPieces(this.checkers.getCurrentBoard());
        });
    }
    handleMouseDown(ev) {
        let p = this.getMousePoint(ev);
        let sourceSquare = toSquare(p, this.squareSize);
        let player = this.checkers.getCurrentBoard().getPlayerAtSquare(sourceSquare);
        if (player == this.checkers.getCurrentBoard().player) {
            let squarePosition = toPosition(sourceSquare, this.squareSize);
            this.dragTarget = sourceSquare;
            this.dragPosition = p;
            this.dragTranslation = subtract(p, squarePosition);
            this.canvas.on('mousemove', this.handleMouseMove.bind(this));
            this.canvas.on('mouseup', this.handleMouseUp.bind(this));
            this.render();
        }
    }
    handleMouseMove(ev) {
        let p = this.getMousePoint(ev);
        this.dragPosition = p;
        this.render();
    }
    handleMouseUp(ev) {
        let p = this.getMousePoint(ev);
        let destinationSquare = toSquare(p, this.squareSize);
        if (destinationSquare >= 0) {
            this.checkers.tryMove(this.dragTarget, destinationSquare);
        }
        this.dragTarget = -1;
        this.dragPosition = null;
        this.canvas.off('mousemove');
        this.canvas.off('mouseup');
        this.render();
    }
    getMousePoint(ev) {
        let rect = this.canvas[0].getBoundingClientRect();
        return {
            x: ev.clientX - rect.left,
            y: ev.clientY - rect.top
        };
    }
    drawPiece(point, fillColor, strokeColor, translation) {
        const halfSquare = (this.squareSize * 0.5);
        const x = point.x + translation.x;
        const y = point.y + translation.y;
        this.ctx.beginPath();
        this.ctx.fillStyle = fillColor;
        this.ctx.lineWidth = 5;
        this.ctx.strokeStyle = strokeColor;
        this.ctx.arc(x, y, halfSquare - 10, 0, 2 * Math.PI, false);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    }
    drawPieces(bitboard) {
        let drawDragTarget;
        let translation = { x: this.squareSize * 0.5, y: this.squareSize * 0.5 };
        for (let i = 0; i < checkers_bitboard_1.SQUARE_COUNT; i++) {
            let fillColor;
            let strokeColor;
            switch (bitboard.getPlayerAtSquare(i)) {
                case checkers_bitboard_1.Player.White:
                    fillColor = 'white';
                    strokeColor = 'black';
                    break;
                case checkers_bitboard_1.Player.Black:
                    fillColor = 'black';
                    strokeColor = 'white';
                    break;
                default:
                    continue;
            }
            if (i == this.dragTarget) {
                let dragTranslation = subtract(translation, this.dragTranslation);
                drawDragTarget = this.drawPiece.bind(this, this.dragPosition, fillColor, strokeColor, dragTranslation);
            }
            else {
                let position = toPosition(i, this.squareSize);
                this.drawPiece(position, fillColor, strokeColor, translation);
            }
        }
        if (drawDragTarget) {
            drawDragTarget();
        }
    }
    drawSquare(row, column) {
        let color = row % 2 == column % 2 ? 'white' : 'black';
        let x = row * this.squareSize;
        let y = column * this.squareSize;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, this.squareSize, this.squareSize);
    }
    drawBoard() {
        for (let i = 0; i < ROW_LENGTH; i++) {
            for (let j = 0; j < COLUMN_LENGTH; j++) {
                this.drawSquare(i, j);
            }
        }
    }
}
exports.CheckersBoard = {
    template: `<canvas width="{{$ctrl.width}}" height="{{$ctrl.height}}">
        <span id="no_html5">Your Browser Does Not Support HTML5's Canvas Feature.</span>
    </canvas>`,
    bindings: {
        width: '<',
        height: '<'
    },
    controller: CheckersBoardController
};

},{"./checkers-bitboard":2}],4:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
class GameMenuController {
    constructor(checkers, $interval) {
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(() => {
            let endTime = new Date();
            this.playTime = (endTime.getTime() - this.checkers.getStartTime()) / 1000;
        }, 1000);
    }
    getCurrentPlayer() {
        switch (this.checkers.getCurrentPlayer()) {
            case checkers_service_1.Player.White:
                return 'White';
            case checkers_service_1.Player.Black:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }
    undoMove() {
        return false;
    }
    getPlayTime() {
        return this.playTime;
    }
}
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        let seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        let minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        let hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        let days = value;
        if (days) {
            return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (hours) {
            return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (minutes) {
            return minutes == 1 ? `${minutes} mins, ${seconds} secs` : `${minutes} mins, ${seconds} secs`;
        }
        else {
            return `${seconds} secs`;
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameMenu = {
    templateUrl: './templates/game-menu.html',
    controller: GameMenuController
};

},{"./checkers-service":7}],5:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
class GameStatsController {
    constructor(checkers, $interval) {
        this.checkers = checkers;
        this.$interval = $interval;
        this.$interval(() => {
            let endTime = new Date();
            this.playTime = (endTime.getTime() - this.checkers.getStartTime()) / 1000;
        }, 1000);
    }
    getCurrentPlayer() {
        switch (this.checkers.getCurrentPlayer()) {
            case checkers_service_1.Player.White:
                return 'White';
            case checkers_service_1.Player.Black:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }
    undoMove() {
        return false;
    }
    getPlayTime() {
        return this.playTime;
    }
}
function TimeFormatFilter() {
    return function (value) {
        value = value || 0;
        let seconds = Math.round(value % 60);
        value = Math.floor(value / 60);
        let minutes = Math.round(value % 60);
        value = Math.floor(value / 60);
        let hours = Math.round(value % 24);
        value = Math.floor(value / 24);
        let days = value;
        if (days) {
            return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (hours) {
            return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
        }
        else if (minutes) {
            return minutes == 1 ? `${minutes} mins, ${seconds} secs` : `${minutes} mins, ${seconds} secs`;
        }
        else {
            return `${seconds} secs`;
        }
    };
}
exports.TimeFormatFilter = TimeFormatFilter;
;
exports.CheckersGameStats = {
    templateUrl: './templates/game-stats.ng',
    controller: GameStatsController
};

},{"./checkers-service":7}],6:[function(require,module,exports){
"use strict";
const checkers_service_1 = require('./checkers-service');
const checkers_board_1 = require('./checkers-board');
const checkers_game_stats_1 = require('./checkers-game-stats');
exports.CheckersModule = angular.module('Checkers', []);
exports.CheckersModule.provider('checkers', checkers_service_1.CheckersProvider);
exports.CheckersModule.component('checkersBoard', checkers_board_1.CheckersBoard);
exports.CheckersModule.component('checkersGameStats', checkers_game_stats_1.CheckersGameStats);
exports.CheckersModule.filter('timeFilter', checkers_game_stats_1.TimeFormatFilter);

},{"./checkers-board":3,"./checkers-game-stats":5,"./checkers-service":7}],7:[function(require,module,exports){
"use strict";
const checkers_bitboard_1 = require('./checkers-bitboard');
var checkers_bitboard_2 = require('./checkers-bitboard');
exports.Player = checkers_bitboard_2.Player;
class Checkers {
    constructor() {
        this.boards = [];
        this.boards.push(new checkers_bitboard_1.Bitboard());
        this.startTime = (new Date()).getTime();
    }
    getCurrentPlayer() {
        return this.getCurrentBoard().player;
    }
    getCurrentBoard() {
        return this.boards[this.boards.length - 1];
    }
    getStartTime() {
        return this.startTime;
    }
    tryMove(source, destination) {
        let currentBoard = this.getCurrentBoard();
        let { success, board } = currentBoard.tryMove(source, destination);
        if (success) {
            this.boards.push(board);
            return true;
        }
        else {
            return false;
        }
    }
}
exports.Checkers = Checkers;
class CheckersProvider {
    $get($injector) {
        return $injector.instantiate(Checkers);
    }
}
exports.CheckersProvider = CheckersProvider;

},{"./checkers-bitboard":2}]},{},[1,2,3,4,5,6,7])


//# sourceMappingURL=bundle.js.map
