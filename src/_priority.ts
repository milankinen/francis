const WEIGHT_BITS = 15
const WEIGHT_MASK = (1 << WEIGHT_BITS) - 1
const ORDER_BITS = 15
const ORDER_MASK = (1 << ORDER_BITS) - 1

export interface Prioritized {
  priority: number
}

export const MAX_ORDER = ORDER_MASK

export const MAX_WEIGHT = WEIGHT_MASK

export const MAX_PRIORITY = (ORDER_MASK << WEIGHT_BITS) & WEIGHT_MASK

export function initPriority(weight: number, order: number): number {
  return ((ORDER_MASK & order) << WEIGHT_BITS) | (weight & WEIGHT_MASK)
}

export function incrementOrder(priority: number): number {
  return initPriority(orderOf(priority) + 1, weightOf(priority))
}

export function weightOf(priority: number): number {
  return priority & WEIGHT_MASK
}

export function orderOf(priority: number): number {
  return (priority >> WEIGHT_BITS) & ORDER_MASK
}
