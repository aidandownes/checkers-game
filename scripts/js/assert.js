"use strict";
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assert failed');
    }
}
exports.assert = assert;
function assertNotEmpty(list, message) {
    if (!list || list.length == 0) {
        throw new Error(message || 'Assert failed: List not empty');
    }
}
exports.assertNotEmpty = assertNotEmpty;
function assertEmpty(list, message) {
    if (!list || list.length != 0) {
        throw new Error(message || 'Assert failed: List empty');
    }
}
exports.assertEmpty = assertEmpty;
