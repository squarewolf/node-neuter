'use strict';

var async = require('async');
var fs = require('fs');
var should = require('should');
var File = require('vinyl');
var Neuter = require('../index');
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
		function(callback) { new Neuter().parse(original, callback) },
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
		fs.readFile('test/expected/simple_require_statements.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().parse('test/fixtures/simple_require_filepath_transforms.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	it('should be ignored if told so', function(done) {
		fs.readFile('test/expected/ignores_files_when_told.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter({
				skipFiles: [
					'test/fixtures/contains_commonjs_require.js'
				],
			}).parse('test/fixtures/ignores_files_when_told.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	it('in javascript statements should be ignored', function(done) {
		fs.readFile('test/expected/do_not_replace_requires_in_statements.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().parse('test/fixtures/do_not_replace_requires_in_statements.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	it('in comments should be ignored', function(done) {
		fs.readFile('test/expected/comment_out_require.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().parse('test/fixtures/comment_out_require.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	describe('not ending with a semicolon', function() {
		it('should be read correctly', function(done) {
			fs.readFile('test/expected/optional_semicolons.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/optional_semicolons.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('with filepath transforms', function() {
		it('should combine in the order of the require statements', function(done) {
			fs.readFile('test/expected/simple_require_filepath_transforms.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter({
					filepathTransform: function(filepath) {
						return 'test/fixtures/' + filepath;
					},
				}).parse('test/fixtures/simple_require_filepath_transforms.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('with basepath options', function() {
		it('should combine in the order of the require statements', function(done) {
			fs.readFile('test/expected/simple_require_filepath_transforms.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter({
					basePath: 'test/fixtures/',
				}).parse('test/fixtures/simple_require_filepath_transforms.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('that are repeated', function() {
		it('should be ignored', function(done) {
			fs.readFile('test/expected/duplicate_require_statements.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/duplicate_require_statements.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('with circular references', function() {
		it('should be correctly handled', function(done) {
			fs.readFile('test/expected/circular_require_statements.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/circular_require_statements.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});
});

describe('Relative require statements', function() {
	it('should combine in the order of the require statements', function(done) {
		fs.readFile('test/expected/relative_require_statements.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().parse('test/fixtures/relative_require_statements.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	describe('with basepath options', function() {
		it('should combine in the order of the require statements', function(done) {
			fs.readFile('test/expected/relative_requires_with_basepath.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter({
					basePath: 'test/fixtures/'
				}).parse('test/fixtures/relative_requires_with_basepath.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});
});

describe('Seperator options', function() {
	it('should be customizable', function(done) {
		fs.readFile('test/expected/custom_separator_options.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter({
				separator: '!!!!',
			}).parse('test/fixtures/simple_require_statements.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});
});

describe('Code order between require statements', function() {
	it('should be left intact', function(done) {
		fs.readFile('test/expected/respects_code_order_between_requires.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().parse('test/fixtures/respects_code_order_between_requires.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});
});

describe('Patterns', function() {
	describe('for files and paths', function() {
		it('should be read correctly', function(done) {
			fs.readFile('test/expected/accepts_file_patterns.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/glob/*.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('with require("glob/*")', function() {
		it('should require all files in that directory', function(done) {
			fs.readFile('test/expected/glob_require.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/glob_require.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('with spaces', function() {
		it('should include correctly', function(done) {
			fs.readFile('test/expected/spaces_allowed_within_require_statement.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/spaces_allowed_within_require_statement.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});

	describe('without .js extension', function() {
		it('should include correctly', function(done) {
			fs.readFile('test/expected/optional_dotjs.js', function(err, expected) {
				if (err) {
					return callback(err);
				}

				new Neuter().parse('test/fixtures/optional_dotjs.js', function(err, result) {
					if (err) {
						throw err;
					}

					result.should.equal(expected.toString());
					done();
				});
			});
		});
	});
});

describe('Source maps', function() {
	it('should be generated', function(done) {
		fs.readFile('test/expected/source_maps.map', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter().generateMap('test/fixtures/glob_require.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});
});

describe('Files', function() {
	it('should be processed as a template', function(done) {
		fs.readFile('test/expected/process_as_template.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter({
				process: {
					data: {
						foo: 5,
						bar: 'baz'
					}
				}
			}).parse('test/fixtures/process_as_template.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});

	it('should be processed with a function', function(done) {
		fs.readFile('test/expected/process_with_function.js', function(err, expected) {
			if (err) {
				return callback(err);
			}

			new Neuter({
				process: function(file) {
					file.contents = Buffer.concat([
						new Buffer('// Source for: ' + file.path + '\n'),
						file.contents,
					]);
					return file;
				}
			}).parse('test/fixtures/simple_require.js', function(err, result) {
				if (err) {
					throw err;
				}

				result.should.equal(expected.toString());
				done();
			});
		});
	});
});
