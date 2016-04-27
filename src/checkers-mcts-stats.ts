/// <reference path="../typings/browser.d.ts" />

import {Checkers, SearchResult} from './checkers-service';

class MctsStatsController {
    searchResult: SearchResult;
    
    constructor(private checkers: Checkers, private $scope: ng.IScope) {
        $scope.$watch(() => checkers.getSearchResult(), (searchResult) => {
            this.searchResult = searchResult;
        });
    }
    
    getWinPercentage():number {
        return this.searchResult ?
            (1 - this.searchResult.winProbabilty) * 100:
            50;
    }
    
    getTime(): number {
        return this.searchResult ? 
            this.searchResult.time : 0;
    }
    
    getIterations(): number {
        return this.searchResult ? 
            this.searchResult.iterations: 0;
    }
}


export const CheckersMctsStats: ng.IComponentOptions = {
    templateUrl: './templates/mcts-stats.ng',
    controller: MctsStatsController
};