
var marked = require('marked');
var fs = require('fs');
var path = require('path');

var string = path.resolve(__dirname, '../../scheduling-data/recovery/main.md');
string = fs.readFileSync(string, 'utf-8');

var collection = [];

var renderer = new marked.Renderer();
renderer.code = function(code, language, escaped) {
	code = code.split('&quot;').join('"');
	collection.push(code);
	return code;
};
renderer.codespan = function(code) {
	code = code.split('&quot;').join('"');
	collection.push(code);
	return code;
};
var string = marked(string, {
	renderer : renderer
});
console.log('collection: ' + JSON.stringify(collection, null, 2));
