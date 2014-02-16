var glob = require('glob');
var async = require('async');
var fs = require('fs');
var File = require('vinyl');
var path = require('path');

function Neuter(options) {
	this.options = options || {};
}

Neuter.prototype.loadFile = function(filepath, done) {
	var filepath = path.resolve(process.cwd(), filepath);

	fs.readFile(filepath, function(err, data) {
		if (err) {
			return done(err);
		}

		var file = new File({
			base: path.dirname(filepath),
			path: filepath,
			contents: data,
		});

		done(null, file);
	});
};

Neuter.prototype.loadFileGlob = function(filepath, done) {
	glob(filepath, (function (err, files) {
		if (err) {
			return done(err);
		}

		async.mapSeries(files, (this.loadFile).bind(this), done);
	}).bind(this));
};

Neuter.prototype.parse = function(file, done) {
	if (typeof file === 'string' || file instanceof String) {
		this.loadFileGlob(file, (function(err, files) {
			if (err) {
				return done(err);
			}

			async.mapSeries(files, (this.parse).bind(this), function(err, result) {
				if (err) {
					return done(err);
				}

				done(null, result.join(''));
			});
		}).bind(this));
	} else {
		// TODO: implement
		process.nextTick(function() {
			done(null, file.contents.toString());
		});
	}
}

Neuter.prototype.generateMap = function(file, done) {
	if (typeof file === 'string' || file instanceof String) {
		this.loadFileGlob(file, (function(err, files) {
			if (err) {
				return done(err);
			}

			async.mapSeries(files, (this.generateMap).bind(this), function(err, result) {
				if (err) {
					return done(err);
				}

				done(null, result.join(''));
			});
		}).bind(this));
	} else {
		// TODO: implement
		process.nextTick(function() {
			done(null, file.contents.toString());
		});
	}
}

module.exports = Neuter;