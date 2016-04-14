# Tips about Lambda

### What saved in memory

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

However, it can be used as cache (probably need to clear cache periodically in order to release memory)

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

### Cold Start vs Hot Start

Lambda will remove code from a container if no request after 10 min. Therefore, in order to avoid a cold start, you may want to invoke your lambda function every 9 minutes (4800 per month) in order to avoid cold start

### Mock event & context

In most of our examples, the event object passed into the invocation of the function has been predetermined by AWS; the format is fairly standard across multiple services. When invoking the function directly, either from the command line or the SDK, the event object is arbitrary. As a good development practice, I recommend standardizing on a common format for all of your events across all functions. Here is a quick example of a format I’ve used for almost all of the functions I’ve created.

```javascript
{
  "metadata": {
    // Information about the invoking resource, date, etc.
   },
  "data": {
    // Arbitrary data required for use in the function
  }
}
```
### Recommended project structure

├── config
│   ├── api.js
│   └── db.js
├── controllers
│   └── objectAdded.js
│   └── objectRemoved.js
├── helpers
│   ├── logger.js
│   └── responses.js
└── index.js

Within the “controllers” directory, each action performed by the Lambda function is separated into new files. For example, if this function responded to S3 “PutObject” and S3 “DeleteObject” events within a bucket, there could be “objectAdded.js” and “objectRemoved.js” controllers. Note that the line between creating multiple Lambda functions and creating multiple controllers within a single function can be blurry at times. As a rule of thumb, I create different Lambda functions if they touch different resources or I want to separate the updates to the functions from one another.
 
To determine which controller to use, the “index.js” file can handle the routing. For example, the following sample code would call the correct controller depending on the S3 event.

```javascript
var objectAdded = require(__dirname + '/controllers/objectAdded.js');
var objectRemoved = require(__dirname + '/controllers/objectRemoved.js');
 
exports.handler = function(event, context) {
  var action = event.Records[0].eventName;

  if (action.indexOf('ObjectCreated') > -1) {
    objectAdded(event, context);
    } else if (action.indexOf('ObjectRemoved') > -1) {
      objectRemoved(event, context);
    } else {
      context.fail('Invalid event');
    }
};
```

Every event source will require a different algorithm for determining the correct route. The API Gateway event source could call a different controller based on the URL path. Custom events could include a controller name in the metadata object. DynamoDB events could utilize a different controller based on the table name. Regardless of what you choose, I’ve found it is easiest to stick with one pattern per event type for all projects.

The “helpers” directory contains resources that can be used in any of the other files in the function. The “logger.js” file could implement custom logging as described in Chapter 10. This file could then be required in all the other files, providing access to common logging functionality across the function. If you want to begin adding a timestamp to logs, the change could then be made in one place. The “responses.js” file could provide the same functionality for standardizing the format of responses. Below is a sample “responses.js” file that I use frequently.

###### logger.js

```javascript
module.exports = function(level) {
  var levelValue = 100;
  switch (level) {
    case 'TRACE':
      levelValue = 0;
      break;
    case 'DEBUG':
      levelValue = 1;
      break;
    case 'INFO':
      levelValue = 2;
      break;
    case 'WARN':
      levelValue = 3;
      break;
    case 'ERROR':
      levelValue = 4;
      break;
    case 'FATAL':
      levelValue = 5;
      break;
    }
 
    // Override all logs if testing with mocha
    if (process.argv.join('').indexOf('mocha') > -1) {
      levelValue = 100;
    }
 
    return {
      trace: function(message) {
        if (levelValue <= 0) {
          console.log('TRACE: ' + message);
        }
      },
      debug: function(message) {
        if (levelValue <= 1) {
          console.log('DEBUG: ' + message);
        }
      },
      info: function(message) {
        if (levelValue <= 2) {
          console.log('INFO: ' + message);
        }
      },
      warn: function(message) {
        if (levelValue <= 3) {
          console.log('WARN: ' + message);
        }
      },
      error: function(message) {
        if (levelValue <= 4) {
          console.log('ERROR: ' + message);
        }
      },
      fatal: function(message) {
        if (levelValue <= 5) {
          console.log('FATAL: ' + message);
        }
      }
    };
};
```

Then, in my main code, I can do the following:

```javascript
var logs = require(__dirname + 'logger.js');
var logger = new logs('INFO');
 
// Application code…

logger.info('Some informational statement');
logger.debug('Some debug statement');
```

###### response.js

```javascript
var succeed = function(context, data) {
  context.succeed({
    status: 200,
    code: 0,
    data: data
  });
};
 
var error = function(context, message, errors, status, code) {
  context.succeed({
    status: status || 200,
    code: code || 1,
    message: message || 'Error',
    errors: (Array.isArray(errors)) ? errors : [errors]
  });
};
 
var fail = function(context, failureMessage) {
  context.fail(failureMessage);
};
 
module.exports = {
  succeed: succeed,
  error: error,
  fail: fail
};
```

### Testing

1. third party [node-lambda](https://www.npmjs.com/package/node-lambda)
2. simulate event and context manually

```javascript
var event = {
  key1: 'value1',
  key2: 'value2'
};
 
var context = {
  succeed: function(event) {
    console.log('Success');
    // Do something with the event
    console.log(JSON.stringify(event,null,2));
  },
  fail: function(event) {
    console.log('Fail');
    console.log(JSON.stringify(event,null,2));
  },
  done: function(event) {
    console.log(JSON.stringify(event,null,2));
  }
};
   
// Call your handler
handler(event, context);
```
3. answer the following questions:
  * Does the function have the correct IAM role and permissions to send logs to CloudWatch?
  * Does the function have the correct IAM role and permissions to access additional resources?
  * Is the function timeout set too low?
  * Do resources accessed by your function limit access by IP address?
  * Does the function always exit using context.fail(), context.succeed(), or context.done()?
  * Is memory shared securely across executions?
