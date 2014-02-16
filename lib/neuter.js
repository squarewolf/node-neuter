
module.exports = {
	neuterFile: function(file, done) {
		process.nextTick(function() {
			done(null, file.contents.toString());
		});
	},
};