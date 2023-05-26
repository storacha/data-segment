# Scripts

This directory contains various scripts used for generating or verifying test vectors.

## `./compile-csv.js`

As of this writing there is no way to load `./test/commp/vector.csv` file across
node test runtime and playwright-test runtime ([see issue](https://github.com/hugomrdias/playwright-test/issues/544)).

To workaround this limitation package `prepare` script uses `./compile-csv.js` to generate `./test/commp/vector.csv.js` file that exports parsed csv file content, which is then used in tests.


## `./generate.js`

This script is used to generate deterministically random bytes of desired size print to stdout. It has been used to generate test vectors by piping inputs desired size into [stream-commp] tool

```sh
node script/generate.js 196608 | stream-commp
```

[stream-commp]:https://github.com/filecoin-project/go-fil-commp-hashhash/tree/master/cmd/stream-commp#usage-example

## `./stream-commp.js`

Provides functionality equivalent to [stream-commp] tool using implementation in this repo.

It is a handy for comparing outputs between battle tested go implementation and this one.

## `./stream-commp-csv.js`

Tool that parses output of the [stream-commp] and prints out CSV row for the `./test/commp/vector.csv`, which had been used to populate that file with content using following pipeline

```sh
node script/generate.js 196608 | stream-commp 2>&1 | node script/stream-commp-csv.js >> test/commp/vector.csv
```


[stream-commp]:https://github.com/filecoin-project/go-fil-commp-hashhash/tree/master/cmd/stream-commp#usage-example
