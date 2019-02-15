
var System = require('./System');
var Loader = require('./Loader');
var path = require('path');

Application = module.exports = Class.extend({
	
	initialize: function() {
		
		this.initializeSystem();
		this.loadSystem();
		this.run(new Date(2019, 0, 13));
		this.run(new Date(2019, 0, 14));
		this.run(new Date(2019, 0, 15));
		this.run(new Date(2019, 0, 16));
		this.run(new Date(2019, 0, 17));
		this.run(new Date(2019, 0, 18));
		this.run(new Date(2019, 0, 19));
	},
	
	initializeSystem: function() {
		this.system = new System();
	},
	
	loadSystem: function() {
		
		this.loader = new Loader.File({
			system: this.system
		});
		var string = '../../../bliss-data/general/main.md';
		string = ['file:/', path.resolve(__dirname, string)].join('');
		console.log('string: ' + string);
		this.loader.load(string);
	},
	
	loadSystem2: function() {
		
		this.loader = new Loader.Basic({
			system: this.system
		});
		if (true) {
			this.loader.load([
				['file:/', path.resolve(__dirname, '../../../scheduling-data/general/main.md')].join(''),
				['file:/', path.resolve(__dirname, '../../../scheduling-data/general/another.md')].join(''),
			], function() {
				console.log('loader done');
			});
		} else {
			this.loader.load([
				['file:/', path.resolve(__dirname, '../../../scheduling-data/general/main.md')].join(''),
				['https://raw.githubusercontent.com/wiki/simplygreathope/schedules/Worship.md?login=login&token=token'].join(''),
			], function() {
				console.log('loader done');
			});
		}
	},
	
	run: function(date) {
		
		var format = require('date-fns/format');
		var result = this.system.test(date);
		console.log(format(date, 'EEE MM/dd/yyyy'));
		result.sort(
			function(a, b) {
				return a.data.time.begin.getTime() - b.data.time.begin.getTime();
			}.bind(this)
		);
		result.forEach(
			function(each) {
				console.log(' - ' + each.data.as + ' @ ' + format(each.data.time.begin, 'HH:mm'));
			}.bind(this)
		);
	},
});
