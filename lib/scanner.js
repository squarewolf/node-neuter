var esprima = require('esprima');
var async = require('async');

// Index containing all relevant node types and a helper method returning the
// specific node's child nodes (if any). For a full specification of all node
// types, see https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API#Node_objects
var NodeTypes = {
	AssignmentExpression: function (node) {
		return [
			node.left,
			node.right,
		];
	},

	ArrayExpression: function (node) {
		return node.elements;
	},

	BlockStatement: function (node) {
		return node.body;
	},

	BinaryExpression: function (node) {
		return [
			node.left,
			node.right,
		];
	},

	CallExpression: function (node) {
		return node.arguments;
	},

	CatchClause: function (node) {
		return node.body;
	},

	ConditionalExpression: function (node) {
		return [
			node.test,
			node.alternate,
			node.consequent,
		];
	},

	DoWhileStatement: function (node) {
		return node.body;
	},

	ExpressionStatement: function (node) {
		return node.expression;
	},

	ForStatement: function (node) {
		return node.body;
	},

	ForInStatement: function (node) {
		return node.body;
	},

	FunctionDeclaration: function (node) {
		return node.body;
	},

	FunctionExpression: function (node) {
		return node.body;
	},

	IfStatement: function (node) {
		var result = [
			node.consequent
		];

		if (node.alternate) {
			result.push(node.alternate);
		}

		return result;
	},

	LogicalExpression: function (node) {
		return [
			node.left,
			node.right,
		];
	},

	MemberExpression: function (node) {
		return [
			node.object,
			node.property,
		];
	},

	NewExpression: function (node) {
		return node.argument;
	},

	ObjectExpression: function (node) {
		return node.properties.map(function(item) {
			return item.value;
		});
	},

	Program: function (node) {
		return node.body;
	},

	ReturnStatement: function (node) {
		return node.argument;
	},

	SequenceExpression: function (node) {
		return node.expressions;
	},

	SwitchStatement: function (node) {
		var result = node.cases;
		result.push(node.discriminant);
		return result;
	},

	SwitchCase: function (node) {
		var result = node.consequent;

		if (node.test) {
			result.push(node.test);
		}

		return result;
	},

	ThrowStatement: function (node) {
		return node.argument;
	},

	TryStatement: function (node) {
		var result = node.guardedHandlers;
		result.push(node.block);

		if (node.handler) {
			result.push(node.handler);
		}

		if (node.finalizer) {
			result.push(node.finalizer);
		}

		return result;
	},

	UnaryExpression: function (node) {
		return node.argument;
	},

	UpdateExpression: function (node) {
		return node.argument;
	},

	VariableDeclaration: function (node) {
		return node.declarations;
	},

	VariableDeclarator: function (node) {
		var result = [];

		if (node.init) {
			result.push(node.init);
		}

		return result;
	},

	WhileStatement: function (node) {
		return [
			node.test,
			node.body,
		];
	},

	WithStatement: function (node) {
		return [
			node.object,
			node.body,
		];
	},
};

module.exports = function(source, functionName, done) {
	var program = esprima.parse(source, {
		range: true,
	});

	function scanNode(node, done) {
		setImmediate(function () {
			if (NodeTypes[node.type] === undefined) {
				return done(null, []);
			}

			var childNodes = NodeTypes[node.type](node);

			if (!childNodes) {
				// skip nodes without children
				return done(null, []);
			}

			if (!Array.isArray(childNodes)) {
				childNodes = [ childNodes ];
			}

			var scanNodes = [];
			var result = [];

			for (var i = 0; i < childNodes.length; i++) {
				var childNode = childNodes[i];

				if (childNode.type === 'FunctionDeclaration' ||
					childNode.type === 'VariableDeclarator') {
					if (childNode.id.name === functionName) {
						// From this point on all function calls in this
						// scope will not be the droids you're looking for...
						break;
					}
				} else if (childNode.type === 'CallExpression') {
					if (childNode.callee.name === functionName) {
						var arguments = [];
						for (var i = 0; i < childNode.arguments.length; i++) {
							var argument = childNode.arguments[i];
							if (argument.type !== 'Literal') {
								return done(new Error('Unsupported require argument type: ' + argument.type));
							}
							arguments.push(argument.value);
						};

						// This is a call to the method we're looking for,
						// add it to the result list!!
						result.push({
							range: childNode.range,
							arguments: arguments,
						});
					}
				}

				// This node should be scanned, add it to the "todo" list
				scanNodes.push(childNode);
			}

			async.map(scanNodes, scanNode, function (err, childResults) {
				if (err) {
					return done(err);
				}

				if (childResults) {
					for (var i = 0; i < childResults.length; i++) {
						result = result.concat(childResults[i]);
					};
				}
				
				done(err, result);
			});
		});
	}

	/*
	console.log(require('util').inspect(program, {
		depth: null
	}));
	*/

	scanNode(program, function(err, calls) {
		if (err) {
			return done(err);
		}

		calls.sort(function(a, b) {
			if (b.range[0] == a.range[0]) {
				return a.range[1] - b.range[1];
			}
			return a.range[0] - b.range[0];
		});

		done(null, calls);
	});
}