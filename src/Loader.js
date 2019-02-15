
var marked = require('marked');
var fs = require('fs');
var axios = require('axios');
var Broadcast = require('./Broadcast');

Loader = module.exports = {
	
	Basic: Class.extend({
		
		initialize: function(options) {
			
			Object.assign(this, options || {});
			this.loader = {
				file : new Loader.File({
					system: this.system
				}),
				http : new Loader.Web({
					system: this.system
				})
			};
		},
		
		load: function(sources, done) {
			
			console.log('Loader.load');
			this.sources = sources;
			this.next(done);
		},
		
		next: function(done) {
			
			if (this.sources.length > 0) {
				var source = this.sources.shift();
				this.invoke(source.substring(0, 5), {
					'file:' : function() {
						this.loader.file.load(source, function() {
							this.next(done);
						}.bind(this));
					}.bind(this),
					'http:' : function() {
						this.loader.http.load(source, function() {
							this.next(done);
						}.bind(this));
					}.bind(this),
					'https' : function() {
						this.loader.http.load(source, function() {
							this.next(done);
						}.bind(this));
					}.bind(this)
				}, function() {
					this.next(done);
				}.bind(this));
			} else {
				done();
			}
		},
		
		invoke: function(key, object, otherwise) {
			
			if (object[key]) {
				object[key]();
			} else {
				otherwise();
			}
		}
	}),
	
	File: Class.extend({
		
		initialize: function(options) {
			
			Object.assign(this, options || {});
		},
		
		load: function(string) {
			
			if (string.indexOf('file://') === 0) {
				string = string.substring(6);
			}
			string = fs.readFileSync(string, 'utf-8');
			var system = this.system;
			var renderer = new marked.Renderer();
			renderer.code = function(code, language, escaped) {
				code = code.split('&quot;').join('"');
				system.push(code);
				return code;
			};
			renderer.codespan = function(code) {
				code = code.split('&quot;').join('"');
				system.push(code);
				return code;
			};
			string = marked(string, {
				renderer: renderer,
			});
		}
	}),
	
	Web: Class.extend({
		
		initialize: function(options) {
			
			Object.assign(this, options || {});
		},
		
		load: function(link, done) {
			
			var system = this.system;
			axios.get(link).then(
				function(response) {
					system.sources.push({
						id: this.id(link),
						link : link,
						content : response.data
					});
					var renderer = new marked.Renderer();
					renderer.code = function(code, language, escaped) {
						code = code.split('&quot;').join('"');
						system.push(code);
						return code;
					};
					renderer.codespan = function(code) {
						code = code.split('&quot;').join('"');
						system.push(code);
						return code;
					};
					string = marked(response.data, {
						renderer: renderer,
					});
					done();
				}.bind(this)
			);
		},
		
		id : function(link) {
			
			var object = link.split('/');
			object = object.pop();
			object = object.split('.');
			object = object.shift();
			object = object.toLowerCase();
		}
	})
};
