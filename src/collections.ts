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

class ListNode<T> {
    constructor(public data: T, public next?: ListNode<T>) {     
    }
}

export class List<T> {
    start: ListNode<T>;
    end: ListNode<T>;
    size: number;
    
    constructor(iterable?: T[]) {
        this.size = 0;
        if (iterable) {
            iterable.forEach((t) => this.add(t));
        }
    }
    
    add(data: T) {
        if (!this.start) {
            this.start = new ListNode(data);
            this.end = this.start;
        } else {
            this.end.next = new ListNode(data);
            this.end = this.end.next;
        }
        this.size++;
    }
    
    delete(data:T) {
        let current = this.start;
        let previous = this.start;
        while (current) {
            if (data === current.data) {
                this.size--;
                if (current === this.start) {
                    this.start = current.next;
                    return;
                }
                
                if (current === this.end) {
                    this.end = previous;
                }
                
                previous.next = current.next
                return;
            }
            previous = current;
            current = current.next;
        }
    }
    
    item(index: number) : T {
        let current = this.start;
        while(current) {
            if (index === 0) {
                return current.data;
            }
            current = current.next;
            index--;
        }
    }
    
    forEach(f: (item:T) => void) {
        let current = this.start;
        while(current) {
            f(current.data);
            current = current.next;
        }
    }
}


// function List() {
//  List.makeNode = function() { 
//   return {data: null, next: null}; 
//  }; 
 
//  this.start = null; 
//  this.end = null; 
  

//  this.insertAsFirst = function(d) { 
//   var temp = List.makeNode(); 
//   temp.next = this.start; 
//   this.start = temp; 
//   temp.data = d; 
//  }; 

//  this.insertAfter = function(t, d) { 
//   var current = this.start; 
//   while (current !== null) { 
//    if (current.data === t) { 
//     var temp = List.makeNode();
//     temp.data = d; 
//     temp.next = current.next; 
//     if (current === this.end) this.end = temp;
//     current.next = temp; 
//     return; 
//    } 
//    current = current.next; 
//    }
//   };

//   this.item = function(i) { 
//    var current = this.start; 
//    while (current !== null) { 
//     i--; 
//     if (i === 0) return current; 
//     current = current.next; 
//    } 
//    return null; 
//   }; 

//  this.each = function(f) {
//   var current = this.start;
//   while (current !== null) { 
//    f(current); 
//    current = current.next; 
//   } 
//  };
// }