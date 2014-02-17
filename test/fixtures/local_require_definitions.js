if (test) {
	function require(a) {
		var redefines_require;
	}
	require('test/fixtures/comment_out_require_1');
}
require('test/fixtures/simple_require');
var simple_requires_come_before_here;
