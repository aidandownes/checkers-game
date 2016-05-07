/// <reference path="../typings/browser.d.ts" />Asset

/**
 * Helper functions for arrays.
 */
export class Arrays {
    /**
     * Finds the maximum value in a array.
     * @param arr The array to search.
     * @param compare The comparison function to use.
     */
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
    
    static findIndex<T>(arr: T[], predicate: (a:T) => boolean) {
        for (let i = 0; i < arr.length; i++) {
            if (predicate(arr[i])) {
                return i;
            }
        }
        
        return -1;
    }
}

class ListNode<T> {
    constructor(public data: T, public next?: ListNode<T>) {     
    }
}

/**
 * Represents a link list node.
 */
export class List<T> {
    private start: ListNode<T>;
    private end: ListNode<T>;
    private size: number;
    
    /**
     * Creates a linked list.
     * @param iterable Optional. A iterable object to initially published the list.
     */
    constructor(iterable?: T[]) {
        this.size = 0;
        if (iterable) {
            iterable.forEach((t) => this.add(t));
        }
    }
    
    /**
     * Add an item to the list.
     * @param data The item to add.
     * @remarks Runs in constant time.
     */
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
    
    /**
     * Deletes an item to the list.
     * @param data The data to remove from the list.
     * @remarks Runs in constant time.
     */
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
    
    /**
     * Gets the item at the specifed index. 
     * @param index Index of item.
     * @remarks Runs in linear time.
     */
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
    
    /**
     * Runs a function for each item in the list. 
     * @param f The function to run for each item in the list.
     */
    forEach(f: (item:T) => void) {
        let current = this.start;
        while(current) {
            f(current.data);
            current = current.next;
        }
    }
    
    /**
     * Gets the size of the list.
     * @return The size of the list.
     */
    getSize(): number {
        return this.size;
    }
}