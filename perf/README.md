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

These tests were run with MacBook Pro 15" (2013) at 2019-01-09.

```
$ node --version
v11.5.0

$ npm start

System information:
 > CPU: Intel® Core™ i7-4980HQ, 2.80 GHz, 8 cores
 > Memory: 17.2 GB total, 12.3 GB available

Running suite mapfilter...

francis stream.map().filter() x 1 (1000 events)    x 7,478 ops/sec ±2.07% (74 runs sampled)
francis stream.map().filter() x 100 (1000 events)  x 4,465 ops/sec ±2.59% (81 runs sampled)
bacon   stream.map().filter() x 1 (1000 events)    x 506 ops/sec ±1.48% (77 runs sampled)
bacon   stream.map().filter() x 100 (1000 events)  x 451 ops/sec ±1.89% (79 runs sampled)
kefir   stream.map().filter() x 1 (1000 events)    x 5,634 ops/sec ±0.90% (79 runs sampled)
kefir   stream.map().filter() x 100 (1000 events)  x 3,966 ops/sec ±0.77% (80 runs sampled)

Running suite pmapfilter...

francis property.map().filter() x 1 (1000 events)    x 6,631 ops/sec ±1.00% (81 runs sampled)
francis property.map().filter() x 100 (1000 events)  x 3,942 ops/sec ±0.49% (83 runs sampled)
bacon   property.map().filter() x 1 (1000 events)    x 459 ops/sec ±1.39% (77 runs sampled)
bacon   property.map().filter() x 100 (1000 events)  x 411 ops/sec ±1.56% (77 runs sampled)
kefir   property.map().filter() x 1 (1000 events)    x 2,913 ops/sec ±0.64% (83 runs sampled)
kefir   property.map().filter() x 100 (1000 events)  x 1,937 ops/sec ±0.54% (81 runs sampled)

Running suite flatmaplatest...

francis stream.flatMapLatest() (10 x 1000 events)  x 1,227 ops/sec ±1.02% (79 runs sampled)
francis stream.flatMapLatest() (1000 x 10 events)  x 761 ops/sec ±2.20% (81 runs sampled)
bacon   stream.flatMapLatest() (10 x 1000 events)  x 85.12 ops/sec ±1.15% (77 runs sampled)
bacon   stream.flatMapLatest() (1000 x 10 events)  x 48.82 ops/sec ±2.72% (74 runs sampled)
kefir   stream.flatMapLatest() (10 x 1000 events)  x 1,232 ops/sec ±0.95% (82 runs sampled)
kefir   stream.flatMapLatest() (1000 x 10 events)  x 913 ops/sec ±0.58% (84 runs sampled)

Running suite combinetemplate...

francis combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 76.25 ops/sec ±0.48% (84 runs sampled)
francis combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 612 ops/sec ±0.50% (84 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 6.57 ops/sec ±3.40% (35 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 47.97 ops/sec ±1.81% (73 runs sampled)
kefir   combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 3.81 ops/sec ±0.52% (23 runs sampled)
kefir   combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 7.52 ops/sec ±0.31% (39 runs sampled)

Running suite zip...

francis zipAsArray(...width) (1000 events, width = 5)   x 1,534 ops/sec ±0.96% (81 runs sampled)
francis zipAsArray(...width) (1000 events, width = 50)  x 56.48 ops/sec ±2.14% (84 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 5)   x 277 ops/sec ±0.47% (82 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 50)  x 53.12 ops/sec ±0.87% (80 runs sampled)
kefir   zipAsArray(...width) (1000 events, width = 5)   x 1,168 ops/sec ±0.57% (84 runs sampled)
kefir   zipAsArray(...width) (1000 events, width = 50)  x 108 ops/sec ±0.57% (81 runs sampled)

Running suite diamond...

francis diamond x 2 layers   x 1,689 ops/sec ±0.70% (83 runs sampled)
francis diamond x 5 layers   x 354 ops/sec ±0.58% (83 runs sampled)
francis diamond x 10 layers  x 85.29 ops/sec ±0.52% (77 runs sampled)
francis diamond x 20 layers  x 18.66 ops/sec ±0.90% (53 runs sampled)
bacon   diamond x 2 layers   x 120 ops/sec ±1.21% (77 runs sampled)
bacon   diamond x 5 layers   x 33.85 ops/sec ±1.61% (77 runs sampled)
bacon   diamond x 10 layers  x 8.15 ops/sec ±3.01% (42 runs sampled)
bacon   diamond x 20 layers  x 1.86 ops/sec ±3.83% (13 runs sampled)
kefir   diamond x 2 layers   x 1,045 ops/sec ±0.74% (80 runs sampled)
kefir   diamond x 5 layers   x 78.08 ops/sec ±0.51% (72 runs sampled)
kefir   diamond x 10 layers  x 1.23 ops/sec ±1.43% (11 runs sampled)

Running suite tree...

francis tree x 3 depth   x 10,231 ops/sec ±1.60% (82 runs sampled)
francis tree x 10 depth  x 40.67 ops/sec ±0.61% (64 runs sampled)
bacon   tree x 3 depth   x 412 ops/sec ±1.51% (80 runs sampled)
bacon   tree x 10 depth  x 5.22 ops/sec ±4.14% (29 runs sampled)
kefir   tree x 3 depth   x 7,815 ops/sec ±3.22% (76 runs sampled)
kefir   tree x 10 depth  x 12.12 ops/sec ±3.08% (59 runs sampled)

Done
```
