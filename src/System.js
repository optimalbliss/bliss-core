

var Config = require('./Config');
var Source = require('./Source');
var Context = require('./Context');

System = module.exports = Class.extend({
	
   initialize: function(options) {
		
		Object.assign(this, options);
		this.sources = [];
		this.contexts = [];
   },
   
   push: function(string) {
		
		if (false) console.log('System.push: ' + string);
		var context =  Context.create();
		try {
			context.compile(string);
			this.contexts.push(context);
		} catch (e) {
			console.log(e);
		}
   },
   
   test: function(date) {
   	
   	var result = [];
   	this.contexts.forEach(function(context) {
   		if (context.test(date)) {
   			result.push(context);
   		}
   	}.bind(this));
   	return result;
   }
});
