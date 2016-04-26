/// <reference path="../typings/browser.d.ts" />

import * as Asserts from './assert';

export interface Hashable {
    getHashCode(): number;
}

export class HashMap<T extends Hashable, V> {
    private map: Map<number, V> = new Map<number, V>();
    
    set(key:T, value:V) {
        Asserts.assert(!!key);
        this.map.set(key.getHashCode(), value);
    }
    
    get(key:T): V {
        Asserts.assert(!!key);
        return this.map.get(key.getHashCode()); 
    }
    
    has(key:T): boolean {
        Asserts.assert(!!key);
        return this.map.has(key.getHashCode());
    }
}

export class Arrays {
    
    static max<T>(arr: T[], compare: (a:T, b:T) => boolean) {
        let len = arr.length;
        let max:T;
        
        while (len--) {
            if (max == undefined) {
                max = arr[len];
            } else if (compare(arr[len], max)) {
                max = arr[len];
            }
        }
        return max;
    }
}