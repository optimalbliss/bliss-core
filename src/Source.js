
var Class = require('./Class');

Source = module.exports = Class.extend({
	
   initialize: function(options) {
		
      Object.assign(this, options || {});
		
		if (true) {
			this.array = [];
			var buffer = [];
			var quote = false;
			for (let ch of this.string) {
				if (ch == ' ') {
					if (! quote) {
						this.array.push(buffer.join(''));
						buffer = [];
					} else {
						buffer.push(ch);
					}
				} else if (ch == '"') {
					quote = ! quote;
				} else {
					buffer.push(ch);
				}
			}
			if (buffer.length > 0) {
				this.array.push(buffer.join(''));
			}
		}
		
      if (false) {
			this.array = this.string.split(' ');
      }
      if (false) {
			this.array = this.string.match(/\S+|"[^"]+"/g);
      }
      if (false) {
			var pattern = Pattern()
			.whitespace()
			.addModifier('g');
			this.array = this.string.split(pattern.toRegExp());
      }
   },
	
   length: function() {
      return this.array.length;
   },
	
	resolve: function(word) {
		
      var action = this.actions.find(word);
      if (action) {
           return {
               word: word,
               value: word,
               action: action
           };
      } else {
           var object = this.detect(word);
           if (object) {
               action = this.actions.find({
                   type: object.type
               });
               return {
                   word: word,
                   type: object.type,
                   value: object.value,
                   action: action
               };
           } else {
               return {
                   word: word,
                   type: 'string',
                   value: word,
                   action: null
               };
           }
      }
	},
	
   take: function() {
		
      var word = this.array.shift();
      if (false) console.log('word: ' + word);
      return this.resolve(word);
   },
	
   untake: function() {
      return;
   },
	
   peek: function() {
		
   	if (this.array.length > 0) {
   		return this.resolve(this.array[0]);
   	} else {
   		return null;
   	}
   },
	
   skip: function(word) {
		
      var item = this.peek();
      if (item.word == word) {
      	this.take(word);
      }
   },
	
   detect: function(word) {        // move this into Detectors class
		
      var result = null;
      Object.keys(this.recognizers).forEach(function(each) {
			if (result === null) {
				var object = this.recognizers[each](word);
				if (object) {
					result = object;
				}
			}
      }.bind(this));
      return result;
   }
});
