var test = require('tape');
var Context = require('../src/Context');

test('schedule event as "Meeting" on 1/15/2019 at 12:00am', function(t) {
	var context = Context.create().compile('schedule event as "Meeting" on 1/15/2019 at 12:00pm');
	t.equal(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.end();
});

test('schedule event as "Meeting" on 1/15/2019 at 1:00pm until 1:00pm', function(t) {
	var context = Context.create().compile('schedule event as "Meeting" on 1/15/2019 at 12:00pm until 13:00pm');
	t.equal(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.end();
});

test('schedule event as "Meeting" on 1/15/2019 at 12:00am', function(t) {
	var context = Context.create().compile('schedule event as "Meeting" on 1/15/2019 at 12:00am');
	t.equal(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.end();
});

test('schedule event on 1/15/2019 at 12:00am', function(t) {
	var context = Context.create().compile('schedule event on 1/15/2019 at 12:00am');
	t.equal(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.end();
});

test('schedule event every week on Sunday at 12:00am', function(t) {
	var context = Context.create().compile('schedule event every week on Sunday at 12:00am');
	t.equal(context.test(new Date(2019, 0, 13)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.notEqual(context.test(new Date(2019, 0, 17)), true);
	t.notEqual(context.test(new Date(2019, 0, 18)), true);
	t.notEqual(context.test(new Date(2019, 0, 19)), true);
	t.equal(context.test(new Date(2019, 0, 20)), true);
	t.end();
});

test('schedule event every one week on Sunday at 12:00am', function(t) {
	var context = Context.create().compile('schedule event every one week on Sunday at 12:00am');
	t.equal(context.test(new Date(2019, 0, 13)), true);
	t.notEqual(context.test(new Date(2019, 0, 14)), true);
	t.notEqual(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 0, 16)), true);
	t.notEqual(context.test(new Date(2019, 0, 17)), true);
	t.notEqual(context.test(new Date(2019, 0, 18)), true);
	t.notEqual(context.test(new Date(2019, 0, 19)), true);
	t.equal(context.test(new Date(2019, 0, 20)), true);
	t.end();
});

test('schedule event every other week on Sunday at 12:00am beginning 1/1/2019', function(t) {
	var context = Context.create().compile('schedule event every other week on Sunday at 12:00am beginning 1/1/2019');
	t.equal(context.test(new Date(2019, 0, 6)), true);
	t.notEqual(context.test(new Date(2019, 0, 13)), true);
	t.equal(context.test(new Date(2019, 0, 20)), true);
	t.notEqual(context.test(new Date(2019, 0, 27)), true);
	t.equal(context.test(new Date(2019, 1, 3)), true);
	t.end();
});

test('schedule event every two weeks on Sunday at 12:00am beginning 1/1/2019', function(t) {
	var context = Context.create().compile('schedule event every two weeks on Sunday at 12:00am beginning 1/1/2019');
	t.equal(context.test(new Date(2019, 0, 6)), true);
	t.notEqual(context.test(new Date(2019, 0, 13)), true);
	t.equal(context.test(new Date(2019, 0, 20)), true);
	t.notEqual(context.test(new Date(2019, 0, 27)), true);
	t.equal(context.test(new Date(2019, 1, 3)), true);
	t.end();
});

test('schedule event every three weeks on Sunday at 12:00am beginning 1/1/2019', function(t) {
	var context = Context.create().compile('schedule event every three weeks on Sunday at 12:00am beginning 1/1/2019');
	t.equal(context.test(new Date(2019, 0, 6)), true);
	t.notEqual(context.test(new Date(2019, 0, 13)), true);
	t.notEqual(context.test(new Date(2019, 0, 20)), true);
	t.equal(context.test(new Date(2019, 0, 27)), true);
	t.notEqual(context.test(new Date(2019, 1, 3)), true);
	t.notEqual(context.test(new Date(2019, 1, 10)), true);
	t.equal(context.test(new Date(2019, 1, 17)), true);
	t.end();
});

test('schedule event every month on the second Tuesday at 5:45pm', function(t) {
	var context = Context.create().compile('schedule event every month on the second Tuesday at 5:45pm');
	t.notEqual(context.test(new Date(2019, 0, 1)), true);
	t.equal(context.test(new Date(2019, 0, 8)), true);
	t.notEqual(context.test(new Date(2019, 0, 15)), true);
	t.end();
});

test('schedule event every other month on the second Tuesday at 5:45pm beginning 1/1/2019', function(t) {
	var context = Context.create().compile('schedule event every other month on the second Tuesday at 5:45pm beginning 1/1/2019');
	t.notEqual(context.test(new Date(2019, 0, 1)), true);
	t.equal(context.test(new Date(2019, 0, 8)), true);
	t.notEqual(context.test(new Date(2019, 0, 15)), true);
	t.notEqual(context.test(new Date(2019, 1, 5)), true);
	t.notEqual(context.test(new Date(2019, 1, 12)), true);
	t.notEqual(context.test(new Date(2019, 1, 19)), true);
	t.notEqual(context.test(new Date(2019, 2, 5)), true);
	t.equal(context.test(new Date(2019, 2, 12)), true);
	t.notEqual(context.test(new Date(2019, 2, 19)), true);
	t.end();
});

// test('schedule event every month on the 3rd at 12:00pm', function(t) {

// 	var context =  Context.create().compile('schedule event every month on the 3rd at 12:00pm');
// 	t.end();
// });

// test('schedule event on 1/1/2018 at 12:00am for one hour reminding two minutes before', function(t) {

// 	t.pass('passed');
// 	t.end();
// });

// test('schedule event every other week on Sunday and Monday at 12:00am for one hour reminding two minutes before', function(t) {

// 	t.pass('passed');
// 	t.end();
// });

// test('schedule event every week on Sunday at 12:00am', function(t) {

// 	t.pass('passed');
// 	t.end();
// });
