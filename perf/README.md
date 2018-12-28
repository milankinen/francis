# Performance comparison between `francis` and `bacon`

This directory contains some performance comparisons between Francis and Bacon.
Any improvements and fixes are welcome.

## Running performance tests

Performance tests can be run by using the following commands (run `npm i` first):

```bash
npm start       # run performance tests
npm run mem     # run memory tests
```

## Running visualized performance comparisons

Some tests have a graphical visualization drawn to HTML canvas. You can compile
and run the visalizations page by using the following command:

```bash
npm run visualize
```

## Latest test results

These tests were run with MacBook Pro 15" (2013) at 2018-12-28.

```
$ npm start

System information:
 > CPU: Intel® Core™ i7-4980HQ, 2.80 GHz, 8 cores
 > Memory: 17.2 GB total, 10.4 GB available

Running suite mapfilter...

francis stream.map().filter() x 1 (1000 events)    x 6,875 ops/sec ±2.07% (75 runs sampled)
francis stream.map().filter() x 100 (1000 events)  x 4,384 ops/sec ±1.73% (78 runs sampled)
bacon   stream.map().filter() x 1 (1000 events)    x 520 ops/sec ±1.43% (79 runs sampled)
bacon   stream.map().filter() x 100 (1000 events)  x 432 ops/sec ±1.32% (73 runs sampled)

Running suite pmapfilter...

francis property.map().filter() x 1 (1000 events)    x 6,079 ops/sec ±1.81% (76 runs sampled)
francis property.map().filter() x 100 (1000 events)  x 3,735 ops/sec ±1.64% (79 runs sampled)
bacon   property.map().filter() x 1 (1000 events)    x 439 ops/sec ±1.20% (78 runs sampled)
bacon   property.map().filter() x 100 (1000 events)  x 378 ops/sec ±1.20% (81 runs sampled)

Running suite flatmaplatest...

francis stream.flatMapLatest() (10 x 1000 events)  x 1,117 ops/sec ±2.14% (76 runs sampled)
francis stream.flatMapLatest() (1000 x 10 events)  x 714 ops/sec ±2.04% (80 runs sampled)
bacon   stream.flatMapLatest() (10 x 1000 events)  x 74.29 ops/sec ±3.65% (70 runs sampled)
bacon   stream.flatMapLatest() (1000 x 10 events)  x 45.74 ops/sec ±5.69% (72 runs sampled)

Running suite combinetemplate...

francis combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 74.19 ops/sec ±2.27% (82 runs sampled)
francis combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 601 ops/sec ±2.73% (79 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 6.48 ops/sec ±2.76% (35 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 47.24 ops/sec ±1.49% (72 runs sampled)

Running suite zip...

francis zipAsArray(...width) (1000 events, width = 5)   x 1,496 ops/sec ±3.08% (80 runs sampled)
francis zipAsArray(...width) (1000 events, width = 50)  x 55.91 ops/sec ±2.40% (83 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 5)   x 282 ops/sec ±0.48% (80 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 50)  x 54.55 ops/sec ±0.47% (81 runs sampled)

Running suite diamond...

francis diamond x 2 layers   x 1,712 ops/sec ±0.65% (83 runs sampled)
francis diamond x 20 layers  x 18.21 ops/sec ±0.84% (81 runs sampled)
bacon   diamond x 2 layers   x 114 ops/sec ±0.90% (73 runs sampled)
bacon   diamond x 20 layers  x 1.95 ops/sec ±1.73% (14 runs sampled)

Running suite tree...

francis tree x 3 depth   x 10,996 ops/sec ±0.59% (81 runs sampled)
francis tree x 10 depth  x 40.70 ops/sec ±0.77% (64 runs sampled)
bacon   tree x 3 depth   x 419 ops/sec ±1.54% (77 runs sampled)
bacon   tree x 10 depth  x 4.78 ops/sec ±6.36% (27 runs sampled)

Done
```
