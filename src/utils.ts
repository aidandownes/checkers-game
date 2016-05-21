import {assert} from './assert'

export function clamp(value: number, min: number, max:number): number {
    assert(min <= max, 'min is greater than max');
    
    if (value < min) {
        return min;
    } else if (value > max) {
        return max;
    } else return value;
}