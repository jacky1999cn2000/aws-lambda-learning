'use strict';

let AWS = require('aws-sdk-promise');
let s3 = new AWS.S3();
let co = require('co');
let gm = require('gm').subClass({imageMagick:true});
let Q = require('q');

let widths = [480, 640, 1000];
let key,bucket;

function imgResizeAndToBuffer(buffer,width,suffix){
  let deferred = Q.defer();
  gm(buffer).resize(width).toBuffer(suffix, function(err, buffer){
    if(err){
      deferred.reject(err);
    }else{
      deferred.resolve(buffer);
    }
  });
  return deferred.promise;
}

exports.handler = function(event, context){

  co(function* (){
    // retrieve the image that triggered this event
    bucket = event.Records[0].s3.bucket.name;
    key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g,' '));
    let params = {
      Bucket: bucket,
      Key: key
    };
    let s3response = yield s3.getObject(params).promise();

    // if error, return as fail
    if(s3response.error){
      return context.fail(s3response.error);
    }

    // get resized buffers
    let bufferPromiseList = [];
    widths.forEach(function(width){
      bufferPromiseList.push(imgResizeAndToBuffer(s3response.data.Body,width,'jpg'));
    });
    let resizedBufferList = yield bufferPromiseList;

    // upload all resized images
    let uploadPromiseList = [];
    resizedBufferList.forEach(function(resizedBuffer,index){
      let params = {
        Bucket: bucket,
        Key: 'imageprocessing/resized/' + widths[index] + '-' + key.split('/')[2],
        Body: resizedBuffer,
        ContentType: 'image/jpg'
      };
      uploadPromiseList.push(s3.putObject(params).promise());
    });
    let uploadResultList = yield uploadPromiseList;
    return 'Success';
  })
  .then(function(response){
    console.log('response: ',response);
    context.succeed('Upload ' + response);
  })
  .catch(function(err){
    console.log('*** catch ***');
    console.log(err);
    context.fail('Error getting object ' + key + ' from bucket ' + bucket);
  });

}
