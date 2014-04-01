var glob = require('glob');
var async = require('async');
var fs = require('fs');
var File = require('vinyl');
var path = require('path');
var scanner = require('./scanner');
var _ = require('lodash');
var sourceMap = require('source-map');

var TEMPLATE_OPTIONS = {
	escape: /\{%\-(.+?)%\}/g,
	evaluate: /\{%(.+?)%\}/g,
	interpolate: /\{%\=(.+?)%\}/g,
};

function normalizeOptions(options) {
	return {
		basePath: options.basePath || '',
		filepathTransform: options.filepathTransform || function(filepath){ return filepath; },
		template: options.template || '(function() {\n\n{%= src %}\n\n})();',
		separator: options.separator || '\n\n',
		skipFiles: options.skipFiles || [],
		process: options.process || false,
	};
}

function Neuter(options) {
	this.options = normalizeOptions(options || {});
	this.required = [];
}

Neuter.prototype.processFile = function(file) {
	if (this.options.process === false) {
		// don's process the files
	} else if (this.options.process === true) {
		// process the files as template, without data
		file.contents = new Buffer(_.template(file.contents.toString(), {}, TEMPLATE_OPTIONS));
	} else if (_.isPlainObject(this.options.process)) {
		// process the files as template, without data
		file.contents = new Buffer(_.template(file.contents.toString(), this.options.process, TEMPLATE_OPTIONS));
	} else if (_.isFunction(this.options.process)) {
		file = this.options.process(file);
	} else {
		throw new Error('Unsupported value for options.process');
	}

	return file;
};

Neuter.prototype.loadFile = function(filePath, done) {
	fs.readFile(filePath, (function(err, data) {
		if (err) {
			return done(err);
		}

		var file = new File({
			base: this.options.basePath,
			path: path.relative(this.options.basePath || process.cwd(), filePath),
			contents: data,
		});

		done(null, file);
	}).bind(this));
};

Neuter.prototype.loadFileGlob = function(filepath, done) {
	glob(filepath, (function (err, files) {
		if (err) {
			return done(err);
		}

		async.mapSeries(files, (this.loadFile).bind(this), done);
	}).bind(this));
};

Neuter.prototype.generateSourceNode = function(sections) {
	var sourceNode = new sourceMap.SourceNode(null, null, null);

	var beforeOffset = 0;
	var afterOffset = 0;

	var match;
	if (match = this.options.template.match(/([\S\s]*)(?=\{%= src %\})/)) {
		beforeOffset = match[0].split('\n').length - 1;
	}
	if (match = this.options.template.match(/\{%= src %\}([\S\s]*)/)) {
		afterOffset = match[1].split('\n').length - 1;
	}

	for (var i = 0; i < sections.length; i++) {
		var section = sections[i];

		// Split by lines, but mainain newlines
		var chunks = section.src.split('\n');
		for (var j=0; j < chunks.length - 1; j++) {
			chunks[j] = chunks[j] + '\n';
		}

		// Lines that map to their original file are added as SourceNodes
		// (with line data). Others are added as dataless chunks.
		for (var k=0; k < chunks.length; k++) {
			var line = chunks[k];
			if (k > beforeOffset && k < chunks.length - afterOffset) {
				sourceNode.add(new sourceMap.SourceNode(k + 1 - beforeOffset, 0, section.file, line));
			} else {
				sourceNode.add(line);
			}
		}

		if (i != sections.length - 1) {
			// If this isn't the last file, add the separator as a dataless chunk.
			sourceNode.add(this.options.separator);
		}
	}

	return sourceNode;
};

Neuter.prototype.parse = function(file, done) {
	this.loadSource(file, (function (err, result) {
		if (err) {
			return done(err);
		}

		/*
		if (file === 'test/fixtures/respects_code_order_between_requires.js') {
			console.log(require('util').inspect(result, {
				depth: null
			}));
		}
		*/

		// flatten the "call stack"
		result = _.flatten(result);

		var compiledTemplate = _.template(this.options.template, null, TEMPLATE_OPTIONS);

		// wrap all source parts in the specified template
		var wrappedSections = result.map(function(section, index, arr) {
			section.src = compiledTemplate(section);
			return section;
		});

		var sourceNode = this.generateSourceNode(wrappedSections);

		done(null, sourceNode);
	}).bind(this));
}

Neuter.prototype.loadSource = function(file, done) {
	if (_.isString(file)) {
		this.loadFileGlob(file, (function(err, files) {
			if (err) {
				return done(err);
			}

			async.mapSeries(files, (this.loadSource).bind(this), (function(err, result) {
				if (err) {
					return done(err);
				}

				var merged = [];
				for (var i = 0; i < result.length; i++) {
					// filter out ignored requires
					if (result[i] !== false) {
						merged = merged.concat(result[i]);
					}
				}

				done(null, merged);
			}).bind(this));
		}).bind(this));
	} else {
		if (_.contains(this.required, file.path)) {
			// the file has already been included,
			// "ignore" the require by returning false
			setImmediate(function() {
				done(null, false);
			});
			return;
		}

		this.required.push(file.path);

		if (_.contains(this.options.skipFiles, file.path)) {
			// don't parse, just return the source
			done(null, [{
				file: file.path,
				src: file.contents.toString(),
			}]);
			return;
		}

		try {
			file = this.processFile(file);
		} catch (err) {
			done(err);
			return;
		}

		scanner(file.contents.toString(), 'require', (function(err, calls) {
			var contents = file.contents.toString();

			if (err) {
				var error = new Error('Error parsing ' + file.path + ' - ' + err);
				return done(error);
			}

			if (calls.length == 0) {
				done(null, [{
					file: file.path,
					src: contents,
				}]);
			} else {
				var requiredPaths = [];

				for (var i = 0; i < calls.length; i++) {
					for (var j = 0; j < calls[i].arguments.length; j++) {
						var argument = calls[i].arguments[j];

						if (argument[0] === '.') {
							// the path is relative to the current file,
							// prefix with the file's base path
							argument = path.join(path.dirname(file.path), argument);
						}
						
						argument = path.join(this.options.basePath, argument);
						argument = path.join(path.dirname(argument), path.basename(argument, '.js') + '.js');
						argument = this.options.filepathTransform(argument, this.options.basePath);
						argument = path.resolve(process.cwd(), argument);

						requiredPaths.push(argument);
					};
				};

				async.mapSeries(requiredPaths, (this.loadSource).bind(this), (function(err, requiredFiles) {
					if (err) {
						return done(err);
					}

					var result = [];
					var pointer = 0;

					for (var i = 0; i < calls.length; i++) {
						var call = calls[i];

						if (call.range[0] != pointer) {
							var src = contents.substring(pointer, call.range[0]);

							// add source between last and current call
							result.push({
								file: file.path,
								src: src,
							});
						}

						if (requiredFiles[i] !== false) {
							// insert the required source, if it hasn't been included yet
							result.push(requiredFiles[i]);
						}

						pointer = call.range[1];

						// be greedy for the next semicolon
						if (contents[pointer] === ';') {
							pointer++;
						}

						// be greedy for the next newline
						if (contents[pointer] === '\n') {
							pointer++;
						}
					};

					if (pointer < contents.length) {
						var src = contents.substring(pointer);

						// add all source after the last call
						result.push({
							file: file.path,
							src: src,
						});
					}

					done(null, result);
				}).bind(this));
			}
		}).bind(this));
	}
}

module.exports = Neuter;