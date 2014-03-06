# node-neuter [![Build Status](https://travis-ci.org/squarewolf/node-neuter.png?branch=master)](https://travis-ci.org/squarewolf/node-neuter) [![Dependencies](https://david-dm.org/squarewolf/node-neuter.png)](https://david-dm.org/) [![Code Climate](https://codeclimate.com/github/squarewolf/node-neuter.png)](https://codeclimate.com/github/squarewolf/node-neuter)

> Unifies javascript source files in the order you require

## Getting started

The stable version of the node-neuter library can be installed from the
[npm package](https://www.npmjs.org/package/neuter):

```shell
npm install neuter
```

Alternatively the latest version can be installed from git:

```shell
npm install https://github.com/squarewolf/node-neuter/archive/master.tar.gz
```

Then simply require node-neuter in your project

```javascript
var neuter = require('neuter');
```

## About

### Origins

Node-neuter is based on  and
aims to extract the core functionality into a pure node library.

The main goal for node-neuter is to implement a pure node version of the
[grunt-neuter](https://github.com/trek/grunt-neuter) core,
paving the road for implementations for both [grunt](http://gruntjs.com/) and
[gulp](http://gulpjs.com/), as described in
[grunt-neuter issue #47](https://github.com/trek/grunt-neuter/issues/47).

Although based on [grunt-neuter](https://github.com/trek/grunt-neuter),
node-neuter is a rewrite using [esprima](http://esprima.org/) in stead of
regular expressions. As a result of this, node-neuter detects when `require` is
overwritten with a local reference and will then ignore require statements as
long as the local reference is in scope.

In contrast to [grunt-neuter](https://github.com/trek/grunt-neuter), node-neuter
returns a [SourceNode](https://github.com/mozilla/source-map#sourcenode) object,
allowing for custom handling of the parsed code and/or map generation. Because
node-neuter doesn't actually generate the source and map itself, the
[includesourcemap](https://github.com/trek/grunt-neuter#includesourcemap)
option and corresponding features have been dropped.

### Features

  1. Merges files into the main file on each call of ```require(file)```

  2. Ignores calls to locally defined require methods

  3. Support for glob pathnames

  4. Guards against double inclusion

  5. Support for file blacklisting (files will be included raw)

  6. Support for pre-include templating

  7. Support for include basepath

  8. Unifies into a universal
     [SourceNode](https://github.com/mozilla/source-map#sourcenode) object

  9. Support for the [vynil](https://github.com/wearefractal/vinyl) virtual fyle
     format

  10. Passes all [grunt-neuter](https://github.com/trek/grunt-neuter) unit
      tests, excluding those requiring the
      [includesourcemap](https://github.com/trek/grunt-neuter#includesourcemap)
      feature

#### TODO's

  * make full use of Buffers
  * write testcases for `parse(File, callback)` interface
  * write documentation for `parse(File, callback)` interface
  * ...

## Neuter

### Usage

```javascript
var Neuter = require('neuter');

var myNeuter = new Neuter();
myNeuter.parse('myfile.js', function(err, sourceNode) {
	if (err) {
		// ... handle error
		return;
	}

	// ... use the unified sourceNode object to generate source or a map
});
```

#### constructor(options)

##### options.basePath

Specifying a base path allows you to omit said portion of the filepath from your
require statements. For example: when using `basePath: "lib/js/"` in your task
options, `require("lib/js/file.js");` can instead be written as
`require("file.js");`. Note that the trailing slash *must* be included.

Type: `String`
Default: `''`

##### options.filepathTransform

Specifying a filepath transform allows you to control the path to the file that
actually gets concatenated. For example, when using `filepathTransform:
function(filepath){ return 'lib/js/' + filepath; }` in your task options,
`require("lib/js/file.js");` can instead be written as `require("file.js");`
(This achieves the same result as specifying `basePath: "lib/js/"`). When used
in conjunction with the `basePath` option, the base path will be prepended to
the `filepath` argument and a second argument will be provided that is the
directory of the file **without** the `basePath`.

Type: `function`
Default: `function(filepath){ return filepath; }`

##### options.template

Type: `String`
Default: `(function() {\n\n{%= src %}\n\n})();`

##### options.separator

Neutered files will be joined on this string. If you're post-processing
concatenated JavaScript files with a minifier, you may need to use a semicolon
`';'` as the separator although the semicolon at the end of the template should
suffice.

Type: `String`
Default: `\n\n`

##### options.skipFiles

A list of files being required that should not be checked for further require
statements. Useful for libraries that support other module building methods and
leave their requires around in a way that isn't meaningful to neutering.

Type: `Array`
Default: `[]`

##### options.process

Process source files before concatenating, either as
[templates](http://lodash.com/docs#template) or with a custom function. The
delimiters default to neuter's own special type (`{% %}`), which helps avoid
errors when requiring libraries like [Underscore](http://underscorejs.org/) or
[Lo-Dash](http://lodash.com/).

* `false` - No processing will occur.
* `true` - Process source files using [grunt.template.process][] without any
  data.
* `options` object - Process source files using [grunt.template.process][],
using the specified options.
* `function(src, filepath)` - Process source files using the given function,
  called once for each file. The returned value will
  be used as source code.

Type: `Boolean` `Object` `Function`
Default: `false`

## Examples

### Generating neutered source

```javascript
var Neuter = require('neuter');

var myNeuter = new Neuter();
myNeuter.parse('myfile.js', function(err, sourceNode) {
	if (err) {
		// ... handle error
		return;
	}

	var codeMap = sourceNode.toStringWithSourceMap({
		file: 'neutered.js',
	});

	var neuteredSource = codeMap.code;
	console.log(neuteredSource);
});
```

### Generating source map

```javascript
var Neuter = require('neuter');
var path = require('path');
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var SourceMapGenerator = require('source-map').SourceMapGenerator;

var myNeuter = new Neuter();
myNeuter.parse('myfile.js', function(err, sourceNode) {
	if (err) {
		// ... handle error
		return;
	}

	var codeMap = sourceNode.toStringWithSourceMap({
		file: 'neutered.js',
	});

	var consumer = new SourceMapConsumer(codeMap.map.toJSON());
	var generator = SourceMapGenerator.fromSourceMap(consumer);
	var newSourceMap = generator.toJSON();
	newSourceMap.file = path.basename(newSourceMap.file);

	var sourceMap = JSON.stringify(newSourceMap, null, '  ');

	console.log(sourceMap);
});
```

