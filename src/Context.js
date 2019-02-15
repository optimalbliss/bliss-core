var Class = require('./Class');
var Config = require('./Config');

Context = module.exports = Class.extend({
	initialize: function(options) {
		Object.assign(this, options);
		this.data = {
			named: 'Default',
			dates: [],
			period: null,
			dows: [],
			doms: [],
			dowoms: [],
			range: [
				{
					result: {date: 1, month: 0, year: 1970},
				},
				{
					result: {date: 1, month: 0, year: 2030},
				},
			],
		};
	},

	compile: function(string) {
		if (false) console.log('Context.compile');
		this.source = new Source({
			string: string,
			actions: this.config.actions,
			recognizers: this.config.recognizers,
		});
		while (this.source.length() > 0) {
			var item = this.source.take();
			if (item) {
				item.action.run(this, item.value);
			}
		}
		if (false) console.log('this.data: ' + JSON.stringify(this.data, null, 2));
		return this;
	},

	execute: function(options, callback) {
		var results = [];
		var eachDayOfInterval = require('date-fns/eachDayOfInterval');
		var interval = eachDayOfInterval({
			start: options.begin,
			end: options.end,
		});
		interval.forEach(
			function(each) {
				var result = this.test(each);
				if (result) {
					results.push(each);
				}
			}.bind(this)
		);
		callback(results);
	},

	test: function(date) {
		if (false) console.log('Context.test');
		if (false) console.log('this.data: ' + JSON.stringify(this.data, null, 2));
		var result = true;
		if (this.data.dates) {
			this.data.dates.forEach(
				function(each) {
					var isSameDay = require('date-fns/isSameDay');
					if (!isSameDay(date, new Date(each.result.year, each.result.month, each.result.date))) {
						result = false;
					}
				}.bind(this)
			);
		}
		if (this.data.period) {
			if (this.data.dows.length > 0) {
				this.data.dows.forEach(
					function(dow) {
						if (require('date-fns/getDay')(date) !== dow) {
							result = false;
						} else {
							var begin = this.data.range[0].result;
							begin = new Date(begin.year, begin.month, begin.date);
							var offset = begin;
							while (true) {
								if (require('date-fns/getDay')(offset) === dow) {
									break;
								}
								offset = require('date-fns/addDays')(offset, 1);
							}
							var period = this.data.period;
							if (period.unit == 'week') {
								var difference = require('date-fns/differenceInCalendarDays')(date, offset);
								var mod = difference % (7 * period.count);
								if (mod !== 0) {
									result = false;
								}
							} else {
								console.log('period unit is unknown');
								result = false;
							}
						}
					}.bind(this)
				);
			}
			if (this.data.dowoms.length > 0) {
				this.data.dowoms.forEach(
					function(dowom) {
						var begin = this.data.range[0].result;
						begin = new Date(begin.year, begin.month, begin.date);
						if (require('date-fns/getDay')(date) !== dowom.dow) {
							result = false;
						} else if (Math.ceil(date.getDate() / 7) !== dowom.number) {
							result = false;
						} else if (require('date-fns/differenceInCalendarMonths')(date, begin) % 2 === 1) {
							result = false; // fixme: potential starting ambiguity here
						}
					}.bind(this)
				);
			}
		}
		return result;
	},
});

Context.create = function() {
	var config = new Config();
	return new Context({
		config: config,
	});
};
