const Pattern = require("verbal-expressions");
var Class = require("./Class");
var Source = require("./Source");
var Actions = require("./Actions");

var logger = {
	log: function(message) {
		if (false) {
			console.log(message);
		}
	}
};

Configuration = module.exports = Class.extend({
	initialize: function() {
		this.initializeActions();
		this.initializeAssociations();
		this.initializeRecognizers();
	},

	initializeActions: function() {
		this.actions = new Actions();
		this.actions.push({
			schedule: function(context, value) {
				logger.log(value);
			},
			event: function(context, value) {
				logger.log(value);
			},
			as: function(context, value) {
				logger.log(value);
				var item = context.source.take();
				context.data.as = item.value;
				context.data.named = item.value;
			},
			on: function(context, value) {
				logger.log(value);
				context.source.skip("the");
				var item = context.source.take();
				if (item.type == "date") {
					context.data.dates.push({
						result: item.value
					});
				} else if (item.type == "day-of-week") {
					logger.log("day-of-week:" + JSON.stringify(item.value));
					context.data.dows.push(item.value.dow);
				} else if (item.type == "number") {
					var subitem = context.source.take();
					if (subitem.type == "day-of-week") {
						context.data.dowoms.push({
							number: item.value,
							dow: subitem.value.dow
						});
					}
				}
			},
			at: function(context, value) {
				logger.log(value);
				var item = context.source.take();
				if (item.type == "time") {
					context.data.time = {
						begin: item.value
					};
				}
			},
			until: function(context, value) {
				logger.log(value);
				var item = context.source.take();
				if (item.type == "time") {
					context.data.time.end = item.value;
				}
			},
			for: function(context, value) {
				logger.log(value);
				logger.log(
					JSON.stringify({
						number: context.source.take().value,
						unit: context.source.take().value
					})
				);
			},
			every: function(context, value) {
				logger.log(value);
				var period = {
					count: 1
				};
				var item = context.source.take();
				item.action.run(context, item.value);
				if (item.type == "number") {
					period.count = item.value;
					item = context.source.take();
					if (item.type == "unit") {
						period.unit = item.value;
					}
					if (false) item.action.run(context, item.value);
				} else if (item.type == "unit") {
					period.unit = item.value;
				}
				context.data.period = period;
			},
			and: function(context, value) {
				logger.log(value);
				context.source.untake(context.mode);
			},
			reminding: function(context, value) {
				logger.log(value);
				logger.log(
					JSON.stringify({
						number: context.source.take().value,
						unit: context.source.take().value,
						before: context.source.take().value
					})
				);
			},
			before: function(context, value) {
				logger.log(value);
			},
			beginning: function(context, value) {
				logger.log("beginning");
				var item = context.source.take();
				context.data.range[0].result = item.value;
			},
			in: function(context, value) {
				logger.log("in");
				var item = context.source.take();
				context.data.in = item.value;
			},
			with: function(context, value) {
				logger.log("with");
			},
			tags: function(context, value) {
				logger.log("tags");
				var item = context.source.take();
				context.data.tags = item.value;
			},
			data: function(context, value) {
				logger.log("data");
				var item = context.source.take();
				context.data.data = item.value;
			},
			// ':date': function(context, value) {
			// 	logger.log('date: ' + JSON.stringify(value));
			// 	context.data.dates.push({
			// 		result: value
			// 	});
			// },
			// ':time': function(context, value) {
			// 	logger.log('time: ' + JSON.stringify(value));
			// },
			":number": function(context, value) {
				logger.log(value);
			},
			":unit": function(context, value) {
				logger.log(value);
			}
			// ':day-of-week': function(context, value) {
			// 	logger.log('day-of-week:' + JSON.stringify(value));
			// 	context.data.dows.push(value.dow);
			// }
		});

		if (false) this.actions.print();
	},

	initializeAssociations: function() {
		this.associations = {
			units: {
				second: "second",
				seconds: "second",
				minute: "minute",
				minutes: "minute",
				hour: "hour",
				hours: "hour",
				day: "day",
				days: "day",
				week: "week",
				weeks: "week",
				month: "month",
				months: "month",
				quarter: "quarter",
				quarters: "quarter",
				year: "year",
				years: "year"
			},
			"month-of-year": {
				January: 0,
				February: 1,
				March: 2,
				April: 3,
				May: 4,
				June: 5,
				July: 6,
				August: 7,
				September: 8,
				October: 9,
				November: 10,
				December: 11
			},
			"day-of-week": {
				Sunday: 0,
				Monday: 1,
				Tuesday: 2,
				Wednesday: 3,
				Thursday: 4,
				Friday: 5,
				Saturday: 6
			},
			numbers: {
				"1": 1,
				one: 1,
				first: 1,
				"1st": 1,
				other: 2,
				"2": 2,
				two: 2,
				second: 2,
				"2nd": 2,
				"3": 3,
				three: 3,
				third: 3,
				"3rd": 3,
				"4": 4,
				four: 4,
				fourth: 4,
				"4th": 4,
				"5": 5,
				five: 5,
				fifth: 5,
				"5th": 5
			}
		};
	},

	initializeRecognizers: function() {
		var patterns = {};
		this.recognizers = {
			number: function(value) {
				var numbers = this.associations.numbers;
				if (numbers[value]) {
					return {
						type: "number",
						value: numbers[value]
					};
				}
			}.bind(this),
			unit: function(value) {
				var units = this.associations.units;
				if (units[value]) {
					return {
						type: "unit",
						value: units[value]
					};
				}
			}.bind(this),
			date: function(value) {
				var pattern = Pattern()
					.beginCapture()
					.digit()
					.repeatPrevious(1, 2)
					.endCapture()
					.then("/")
					.beginCapture()
					.digit()
					.repeatPrevious(1, 2)
					.endCapture()
					.then("/")
					.beginCapture()
					.digit()
					.repeatPrevious(4)
					.endCapture()
					.addModifier("g");
				var result = pattern.exec(value);
				if (result && result.index > -1) {
					return {
						type: "date",
						value: {
							month: result[1] - 1,
							date: result[2],
							year: result[3]
						}
					};
				}
			}.bind(this),
			time: function(value) {
				var pattern = Pattern()
					.beginCapture()
					.digit()
					.repeatPrevious(1, 2)
					.endCapture()
					.then(":")
					.beginCapture()
					.digit()
					.repeatPrevious(2)
					.endCapture()
					.beginCapture()
					.maybe("pm")
					.maybe("am")
					.endCapture()
					.addModifier("g");
				var result = pattern.exec(value);
				if (result && result.index > -1) {
					var date = new Date();
					var hours = parseInt(result[1]);
					if (result[3] == "pm" && hours != 12) {
						hours = hours + 12;
					}
					date = require("date-fns/setHours")(date, hours);
					date = require("date-fns/setMinutes")(date, result[2]);
					return {
						type: "time",
						value: date
					};
				}
			}.bind(this),
			"month-of-year": function(value) {
				if (value == "January") {
					return {
						type: "month-of-year",
						value: "0-11"
					};
				}
			}.bind(this),
			"day-of-month": function(value) {
				if (value == 1) {
					return {
						type: "day-of-month",
						value: "1-31"
					};
				}
			}.bind(this),
			"day-of-week": function(value) {
				var dows = this.associations["day-of-week"];
				var dow = dows[value];
				if (dow !== undefined) {
					return {
						word: value,
						type: "day-of-week",
						value: {
							dow: dow
						}
					};
				}
			}.bind(this)
		};
	}
});
