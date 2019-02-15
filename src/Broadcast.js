
Class = module.exports = {

	extend: function(properties) {

		var superProto = this.prototype || Class;
		var proto = Object.create(superProto);
		Class.copy(properties, proto);
		var initializer = proto.initialize;
		if (!(initializer instanceof Function)) {
			initializer = function(properties) {
				Object.assign(this, properties);
			};
		}
		initializer.prototype = proto;
		initializer.super = superProto;
		initializer.extend = this.extend;

		return initializer;
	},

	copy: function(source, target) {

		Object.getOwnPropertyNames(source).forEach(function(propName) {
			Object.defineProperty(target, propName, Object.getOwnPropertyDescriptor(source, propName));
		});

		return target;
	}
};

Broadcast = module.exports = {
	
	publish: function(key, data) {
		
		Broadcast.data = Broadcast.data || {};
		if (Broadcast.data[key]) {
			Broadcast.data[key](data);
		}
	},
	
	subscribe: function(key, handler) {
		
		Broadcast.data = Broadcast.data || {};
		Broadcast.data[key] = handler;
	}
};
