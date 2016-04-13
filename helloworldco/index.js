var AWS = require('aws-sdk-promise');
var s3 = new AWS.S3();
var co = require('co');

exports.handler = function(event, context){

  co(function* (){
    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g,''));
    var params = {
      Bucket: bucket,
      Key: key
    };
    var response = yield s3.getObject(params).promise();
    return response;
  })
  .then(function(response){
    console.log('response: ',response);
    console.log('Hello ' + response.data.Body);
    context.succeed('Hello ' + response.data.Body);
  })
  .catch(function(err){
    console.log('*** catch ***');
    console.log(err);
    context.fail('Error getting object ' + key + ' from bucket ' + bucket);
  });

}
