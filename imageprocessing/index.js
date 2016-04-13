var AWS = require('aws-sdk-promise');
var s3 = new AWS.S3();
//var gm = require('gm').subClass({imageMagick:true});

//var widths = [480, 640, 1000];

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
      function(data){
        console.log(err);
        context.fail('Error getting object ' + key + ' from bucket ' + bucket);
      },
      function(err){
        console.log('Hello ' + data.Body);
        context.succeed('Hello ' + data.Body);
      }
    );
}
