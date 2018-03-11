import { Operator } from "./operators/_base"

export abstract class Observable<A> {
  constructor(public op: Operator<any, A>) {}
}
