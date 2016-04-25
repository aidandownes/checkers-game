import {Checkers, Player} from './checkers-service';

class GameStatsController {
    playTime: number;
    constructor(private checkers: Checkers, private $interval:ng.IIntervalService) {
        this.$interval(() => {
            let endTime = new Date();
            this.playTime  = (endTime.getTime() - this.checkers.getStartTime()) / 1000;
        }, 1000);
    }

    getCurrentPlayer(): string {
        switch (this.checkers.getCurrentPlayer()) {
            case Player.One:
                return 'White';
            case Player.Two:
                return 'Black';
            default:
                throw new Error('Unexpected player');
        }
    }

    undoMove(): boolean {
        return false;
    }
    
    getPlayTime(): number {
        return this.playTime;
    }
}

export function TimeFormatFilter(): ng.IFilterNumber {
  return function(value:number): string {
    value = value || 0;
    let seconds = Math.round(value % 60);
    // remove seconds from the date
    value = Math.floor(value / 60);
    // get minutes
    let minutes = Math.round(value % 60);
    // remove minutes from the date
    value = Math.floor(value / 60);
    // get hours
    let hours = Math.round(value % 24);
    // remove hours from the date
    value = Math.floor(value / 24);
    // the rest of value is number of days
    let days = value ;
    
    if (days) {
        return `${days} days, ${hours} hrs, ${minutes} mins, ${seconds} secs`;
    } else if (hours) {
        return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
    } else if (minutes) {
        return minutes == 1 ? `${minutes} mins, ${seconds} secs`: `${minutes} mins, ${seconds} secs`;
    } else {
        return `${seconds} secs`;
    }
  };
};

export const CheckersGameStats: ng.IComponentOptions = {
    templateUrl: './templates/game-stats.ng',
    controller: GameStatsController
};