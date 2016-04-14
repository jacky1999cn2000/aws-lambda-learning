# What Saved in Memory

Since lambda function was run in container, anything saved outside the handler can be considered as global memory (*in the first snippet below, 'ITEMS_TO_PROCESS' array can be read and modifired from any lambda function the is run on the container. If the function uses this array for future dictation of events, one function may wind up processing events pushed to the array from another function that has executed on the same container*), so don't save anything sensitive outside the handler.

```javascript
var ITEMS_TO_PROCESS = [];

exports.handler = function(event, context) {
  for (i in event.items) {
    ITEMS_TO_PROCESS.push(event.items[i]);
  }
  context.succeed();
};
```

```javascript
exports.handler = function(event, context) {

  var ITEMS_TO_PROCESS = [];

  for (i in event.items) {
    ITEMS_TO_PROCESS.push(event.items[i]);
  }
  context.succeed();
};
```

However, it can be used as cache.

```javascript
var CACHE = {};
 
exports.handler = function(event, context) {
  if (CACHE[event.item]) {
    return context.succeed(CACHE[event.item]);
  }

  // Lookup object in database
  db.find(event.item, function(err, item){
    if (err) return context.fail(err);
    CACHE[event.item] = item;
    context.succeed(item);
  });
};
```
