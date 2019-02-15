
var Class = require('./Class');

Actions = module.exports = Class.extend({
	
   initialize: function() {
		
      this.actions = [];
   },

   push: function(object) {
		
      if (object instanceof Array) {
           this.actions.push(...object);
      } else {
           Object.keys(object).forEach(function(each) {
               if (each.charAt(0) == ':') {
                   this.actions.push({
                       on: {
                           type: each.substring(1)
                       },
                       run: object[each]
                   });
               } else {
                   this.actions.push({
                       on: {
                           type: 'string',
                           value: each
                       },
                       run: object[each]
                   });
               }
               if (false) {
                   this.actions.push({
                       on: {
                           type: 'string',
                           value: each,
                           context: null
                       },
                       run: object[each]
                   });
               }
           }.bind(this));
      }
   },

   find: function(key) {

      var result = null;
      if (typeof key === 'string') {
           key = {
               type: 'string',
               value: key
           }
      }
      this.actions.forEach(function(action) {
           if (result === null) {
               if (key.type == 'string') {
                   if (action.on.value == key.value) {
                       result = action;
                   }
               } else {
                   if (action.on.type == key.type) {
                       result = action;
                   }
               }
           }
      }.bind(this));
      return result;
   },

   print: function() {

      console.log(JSON.stringify(this.actions, null, 2));
   }
});
