/// <reference path="../typings/browser.d.ts" />


export function assert(condition:boolean, message?:string) : void {
    if (!condition) {
        throw new Error(message || 'Assert failed');
    }
}

export function assertNotEmpty<T>(list:T[], message?:string): void {
    if (!list || list.length == 0) {
        throw new Error(message || 'Assert failed: List not empty');
    }
}


export function assertEmpty<T>(list:T[], message?:string): void {
    if (!list || list.length != 0) {
        throw new Error(message || 'Assert failed: List empty');
    }
}
