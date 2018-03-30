import { __DEVELOPER__, logAndThrow } from "./_assert"

/*
 * Numbers are implemented as 64bit floating points in JavaScript: this means
 * that we have 52bits to store the integer part. The priority consists of two
 * parts: (1) order and (2) weight.
 *
 * Higher order priority takes always precedence over lower order. If order is
 * same, smaller weight takes priority over bigger weight.
 *
 * To make priority comparison fast, these two values are encoded into single
 * number so that order uses 26 higher bits and weight uses 26 lower bits. Order
 * value is reversed (max_order - actual_order) so that the smaller number
 * indiciates higher priority.
 *
 * Bitwise operations support only 32bit bit sequences so we must use tranditional
 * arithmetic operators instead.
 */

const WEIGHT_BITS = 26
const ORDER_BITS = 26
const ORDER_MULTIPLIER = 1 << WEIGHT_BITS

if (__DEVELOPER__) {
  WEIGHT_BITS + ORDER_BITS > 52 &&
    logAndThrow("Priority mask overflow: " + (WEIGHT_BITS + ORDER_BITS) + " bits")
}

export type Priority = number

export const MAX_ORDER = (1 << ORDER_BITS) - 1

export const MAX_WEIGHT = (1 << WEIGHT_BITS) - 1

export function priorityOf(order: number, weight: number): Priority {
  return (MAX_ORDER - order) * ORDER_MULTIPLIER + weight
}
