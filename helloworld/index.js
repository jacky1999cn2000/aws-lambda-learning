var aws = require('aws-sdk');
var s3 = new aws.S3();

exports.handler = function(event, context) {
  //get the object from the event and show its content type
  var bucket = event.Records[0].s3.bucket.name;
  var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g,''));
  var params = {
    Bucket: bucket,
    Key: key
  };
  s3.getObject(params, function(err, data){
    if(err){
      console.log(err);
      context.fail('Error getting object ' + key + ' from bucket ' + bucket);
    }else{
      console.log('Hello ' + data.Body);
      context.succeed('Hello ' + data.Body);
    }
  });
};
