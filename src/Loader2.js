
var marked = require('marked');
var fs = require('fs');
var axios = require('axios');
var Broadcast = require('./Broadcast');

Loader = module.exports = {
	
	Basic: Class.extend({
		
		initialize: function(options) {
			
			Object.assign(this, options);
			this.loader = {
				file : new Loader.File(),
				http : new Loader.Web()
			};
			this.subscribe();
		},
		
		load: function(sources, done) {
			
			this.sources = sources;
			this.next(done);
		},
		
		next: function(done) {
			
			if (this.sources.length > 0) {
				var source = this.sources.shift();
				this.invoke(source.substring(0, 5), {
					'file:' : function() {
						Broadcast.publish('loadable-file', {
							source: source
						});
					},
					'https' : function() {
						Broadcast.publish('loadable-https', {
							source: source
						});
					}
				});
				this.next(done);
			} else {
				done();
			}
		},
		
		invoke: function(key, object) {
			
			if (object[key]) {
				object[key]();
			}
		},
		
		subscribe: function() {
			
			Broadcast.subscribe('loadable-file:', function(data) {
				this.loader.file.load();
			}.bind(this));
			Broadcast.subscribe('loadable-https', function(data) {
				this.loader.web.load();
			}.bind(this));
		}
	}),
	
	File: Class.extend({
		
		initialize: function(options) {
			Object.assign(this, options);
		},
		
		load: function(string) {
			
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
			Object.assign(this, options);
		},
		
		load: function(done) {
			
			this.sources = [];
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Worship.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Fun.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Hours.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Personal.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Live-Music.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Recovery.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Tech.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Program.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Scripture.md?login=login&token=token');
			this.sources.push('https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Cycling.md?login=login&token=token');
			this.next(done);
		},
		
		next: function(done) {
			
			if (this.sources.length > 0) {
				var source = this.sources.shift();
				var system = this.system;
				axios.get(source).then(
					function(response) {
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
						this.next(done);
					}.bind(this)
				);
			} else {
				done();
			}
		},
	}),
};
