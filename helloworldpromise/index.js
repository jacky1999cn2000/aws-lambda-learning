var AWS = require('aws-sdk-promise');
var s3 = new AWS.S3();

exports.handler = function(event, context){
  var bucket = event.Records[0].s3.bucket.name;
  var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g,''));
  var params = {
    Bucket: bucket,
    Key: key
  };
  s3.getObject(params)
    .promise()
    .then(
      function(response){
        console.log('in data');
        console.log('response: ',response);
        console.log('Hello ' + response.data.Body);
        context.succeed('Hello ' + response.data.Body);
      },
      function(err){
        console.log('in err');
        console.log(err);
        context.fail('Error getting object ' + key + ' from bucket ' + bucket);
      }
    );
}
