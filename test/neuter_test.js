'use strict';

var async = require('async');
var fs = require('fs');
var should = require('should');
var File = require('vinyl');
var neuter = require('../index');
var path = require('path');

function readFileAsync(filepath) {
	var filepath = path.resolve(process.cwd(), filepath);

	return function(callback) {
		fs.readFile(filepath, function(err, data) {
			if (err) {
				return callback(err);
			}

			var file = new File({
				base: path.dirname(filepath),
				path: filepath,
				contents: data,
			});

			return callback(null, file);
		});
	}
}

function loadFiles(original, result, callback) {
	async.parallel([
		readFileAsync(original),
		readFileAsync(result),
	], function(err, results) {
		if (err) {
			throw err;
		}

		callback(results[0], results[1]);
	});
}

describe('Require statements', function() {
	it('should combine in the order of the require statements', function(done) {
		loadFiles(
			'test/fixtures/simple_require_filepath_transforms.js',
			'test/expected/simple_require_statements.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	it('should be ignored if told so', function(done) {
		loadFiles(
			'test/fixtures/ignores_files_when_told.js',
			'test/expected/ignores_files_when_told.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	it('in javascript statements should be ignored', function(done) {
		loadFiles(
			'test/fixtures/do_not_replace_requires_in_statements.js',
			'test/expected/do_not_replace_requires_in_statements.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	it('in comments should be ignored', function(done) {
		loadFiles(
			'test/fixtures/comment_out_require.js',
			'test/expected/comment_out_require.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	describe('not ending with a semicolon', function() {
		it('should be read correctly', function(done) {
			loadFiles(
				'test/fixtures/optional_semicolons.js',
				'test/expected/optional_semicolons.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('with filepath transforms', function() {
		it('should combine in the order of the require statements', function(done) {
			loadFiles(
				'test/fixtures/simple_require_filepath_transforms.js',
				'test/expected/simple_require_filepath_transforms.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('with basepath options', function() {
		it('should combine in the order of the require statements', function(done) {
			loadFiles(
				'test/fixtures/simple_require_filepath_transforms.js',
				'test/expected/simple_require_filepath_transforms.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('that are repeated', function() {
		it('should be ignored', function(done) {
			loadFiles(
				'test/fixtures/duplicate_require_statements.js',
				'test/expected/duplicate_require_statements.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('with circular references', function() {
		it('should be correctly handled', function(done) {
			loadFiles(
				'test/fixtures/circular_require_statements.js',
				'test/expected/circular_require_statements.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});
});

describe('Relative require statements', function() {
	it('should combine in the order of the require statements', function(done) {
		loadFiles(
			'test/fixtures/relative_require_statements.js',
			'test/expected/relative_require_statements.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	describe('with basepath options', function() {
		it('should combine in the order of the require statements', function(done) {
			loadFiles(
				'test/fixtures/relative_requires_with_basepath.js',
				'test/expected/relative_requires_with_basepath.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});
});

describe('Seperator options', function() {
	it('should be customizable', function(done) {
		loadFiles(
			'test/fixtures/simple_require_statements.js',
			'test/expected/custom_separator_options.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});
});

describe('Code order between require statements', function() {
	it('should be left intact', function(done) {
		loadFiles(
			'test/fixtures/respects_code_order_between_requires.js',
			'test/expected/respects_code_order_between_requires.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});
});

describe('Patterns', function() {
	describe('for files and paths', function() {
		it('should be read correctly', function(done) {
			loadFiles(
				'test/fixtures/glob/*.js',
				'test/expected/accepts_file_patterns.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('with require("glob/*")', function() {
		it('should require all files in that directory', function(done) {
			loadFiles(
				'test/fixtures/glob_require.js',
				'test/expected/glob_require.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('with spaces', function() {
		it('should include correctly', function(done) {
			loadFiles(
				'test/fixtures/spaces_allowed_within_require_statement.js',
				'test/expected/spaces_allowed_within_require_statement.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});

	describe('without .js extension', function() {
		it('should include correctly', function(done) {
			loadFiles(
				'test/fixtures/optional_dotjs.js',
				'test/expected/optional_dotjs.js',
				function(source, expected) {
					neuter.neuterFile(source, function(err, result) {
						if (err) {
							throw err;
						}

						result.should.equal(expected.contents.toString());
						done();
					});
				});
		});
	});
});

describe('Source maps', function() {
	it('should be generated', function(done) {
		loadFiles(
			'test/fixtures/glob_require.js',
			'test/expected/source_maps.map',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(result.contents.toString());
					done();
				});
			});
	});

	it('should be included in output', function(done) {
		loadFiles(
			'test/fixtures/glob_require.js',
			'test/expected/source_maps.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});
});

describe('Files', function() {
	it('should be processed as a template', function(done) {
		loadFiles(
			'test/fixtures/process_as_template.js',
			'test/expected/process_as_template.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});

	it('should be processed with a function', function(done) {
		loadFiles(
			'test/fixtures/simple_require.js',
			'test/expected/process_with_function.js',
			function(source, expected) {
				neuter.neuterFile(source, function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.contents.toString());
					done();
				});
			});
	});
});
