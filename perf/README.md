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

These tests were run with MacBook Pro 15" (2013) at 2018-08-19.

```
$ npm start

System information:
 > CPU: Intel® Core™ i7-4980HQ, 2.80 GHz, 8 cores
 > Memory: 17.2 GB total, 10.8 GB available

Running suite mapfilter...

francis stream.map().filter() x 1 (1000 events)    x 7,471 ops/sec ±2.19% (77 runs sampled)
francis stream.map().filter() x 100 (1000 events)  x 5,822 ops/sec ±0.57% (80 runs sampled)
bacon   stream.map().filter() x 1 (1000 events)    x 514 ops/sec ±1.50% (79 runs sampled)
bacon   stream.map().filter() x 100 (1000 events)  x 431 ops/sec ±1.08% (78 runs sampled)

Running suite pmapfilter...

francis property.map().filter() x 1 (1000 events)    x 6,438 ops/sec ±1.60% (81 runs sampled)
francis property.map().filter() x 100 (1000 events)  x 4,718 ops/sec ±0.59% (82 runs sampled)
bacon   property.map().filter() x 1 (1000 events)    x 436 ops/sec ±1.65% (79 runs sampled)
bacon   property.map().filter() x 100 (1000 events)  x 388 ops/sec ±1.27% (79 runs sampled)

Running suite flatmaplatest...

francis stream.flatMapLatest() (10 x 1000 events)  x 1,258 ops/sec ±1.12% (79 runs sampled)
francis stream.flatMapLatest() (1000 x 10 events)  x 807 ops/sec ±1.51% (81 runs sampled)
bacon   stream.flatMapLatest() (10 x 1000 events)  x 83.92 ops/sec ±1.18% (76 runs sampled)
bacon   stream.flatMapLatest() (1000 x 10 events)  x 51.86 ops/sec ±1.81% (78 runs sampled)

Running suite combinetemplate...

francis combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 80.30 ops/sec ±0.75% (73 runs sampled)
francis combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 641 ops/sec ±0.54% (83 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 6, width = 2)  x 6.71 ops/sec ±2.75% (36 runs sampled)
bacon   combineTemplate(...width) x depth (1000 events, depth = 2, width = 6)  x 48.54 ops/sec ±1.61% (74 runs sampled)

Running suite zip...

francis zipAsArray(...width) (1000 events, width = 5)   x 1,503 ops/sec ±0.95% (81 runs sampled)
francis zipAsArray(...width) (1000 events, width = 50)  x 59.51 ops/sec ±2.23% (69 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 5)   x 292 ops/sec ±0.83% (81 runs sampled)
bacon   zipAsArray(...width) (1000 events, width = 50)  x 54.26 ops/sec ±0.97% (81 runs sampled)

Running suite diamond...

francis diamond x 2 layers   x 1,626 ops/sec ±0.70% (81 runs sampled)
francis diamond x 20 layers  x 19.51 ops/sec ±0.95% (54 runs sampled)
bacon   diamond x 2 layers   x 121 ops/sec ±1.33% (78 runs sampled)
bacon   diamond x 20 layers  x 1.99 ops/sec ±2.01% (14 runs sampled)

Running suite tree...

francis tree x 3 depth   x 7,410 ops/sec ±0.98% (79 runs sampled)
francis tree x 10 depth  x 32.20 ops/sec ±1.14% (73 runs sampled)
bacon   tree x 3 depth   x 421 ops/sec ±1.63% (76 runs sampled)
bacon   tree x 10 depth  x 4.80 ops/sec ±4.42% (27 runs sampled)

Done
```

```
$ npm run mem

System information:
 > CPU: Intel® Core™ i7-4980HQ, 2.80 GHz, 8 cores
 > Memory: 17.2 GB total, 10.8 GB available

=== francis memory usage ===
Running suite mapfilter...

Memory statistics:
 > Avg mem: 7.58 MB
 > Max mem: 9.43 MB
 > GC time: 44.10 ms

Running suite pmapfilter...

Memory statistics:
 > Avg mem: 7.94 MB
 > Max mem: 8.24 MB
 > GC time: 45.54 ms

Running suite flatmaplatest...

Memory statistics:
 > Avg mem: 8.5 MB
 > Max mem: 8.75 MB
 > GC time: 5.90 ms

Running suite combinetemplate...

Memory statistics:
 > Avg mem: 8.51 MB
 > Max mem: 8.83 MB
 > GC time: 6.26 ms

Running suite zip...

Memory statistics:
 > Avg mem: 8.68 MB
 > Max mem: 8.99 MB
 > GC time: 10.95 ms

Running suite diamond...

Memory statistics:
 > Avg mem: 8.81 MB
 > Max mem: 9.09 MB
 > GC time: 12.09 ms

Running suite tree...

Memory statistics:
 > Avg mem: 9.05 MB
 > Max mem: 9.24 MB
 > GC time: 3.60 ms

Done

=== bacon.js memory usage ===
Running suite mapfilter...

Memory statistics:
 > Avg mem: 9.81 MB
 > Max mem: 10.2 MB
 > GC time: 4.81 ms

Running suite pmapfilter...

Memory statistics:
 > Avg mem: 10.9 MB
 > Max mem: 10.9 MB
 > GC time: 2.09 ms

Running suite flatmaplatest...

Memory statistics:
 > Avg mem: 15.5 MB
 > Max mem: 24.6 MB
 > GC time: 12.25 ms

Running suite combinetemplate...

Memory statistics:
 > Avg mem: 13.4 MB
 > Max mem: 20.3 MB
 > GC time: 15.09 ms

Running suite zip...

Memory statistics:
 > Avg mem: 12.4 MB
 > Max mem: 15.9 MB
 > GC time: 4.36 ms

Running suite diamond...

Memory statistics:
 > Avg mem: 13.8 MB
 > Max mem: 21.6 MB
 > GC time: 17.28 ms

Running suite tree...

Memory statistics:
 > Avg mem: 18.8 MB
 > Max mem: 36.7 MB
 > GC time: 64.92 ms

Done
```
