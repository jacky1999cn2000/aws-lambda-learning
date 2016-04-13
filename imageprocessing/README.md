# Lambda ImageProcessing

### what this lambda function do
An image uploading to [bucket]/imageprocessing/original folder will trigger the function, and the function will do the following:
1. retrieve the original image
2. get 3 resized images using gm
3. upload these 3 resized images to [bucket]/imageprocessing/resized folder with such name convention [width]-[original-image-name]

### take aways
1. [used Q to convert callbacks into promises](https://strongloop.com/strongblog/promises-in-node-js-with-q-an-alternative-to-callbacks/)
  * directly convert a node-style callback function into a promise
  ```javascript
    var fs_readFile = Q.denodeify(fs.readFile)
    var promise = fs_readFile('myfile.txt')
    promise.then(console.log, console.error)
  ```
  * create a raw promise based on existing callback function
  ```javascript
  function fs_readFile (file, encoding) {
    var deferred = Q.defer()
    fs.readFile(file, encoding, function (err, data) {
      if (err) deferred.reject(err) // rejects the promise with `er` as the reason
      else deferred.resolve(data) // fulfills the promise with `data` as the value
    })
    return deferred.promise // the promise is returned
  }
  fs_readFile('myfile.txt').then(console.log, console.error)
  ```
2. now we have promises, and then can easily use co to write sync-like code
3. S3 bucket key is like this: 'imageprocessing/original/image.jpg', so when uploading a file into 'imageprocessing/resized' folder as '100-image.jpg' as name, the key should be set to something like *Key: 'imageprocessing/resized/' + widths[index] + '-' + key.split('/')[2]* in the parameter (where widths is the array containing different width, and key is the key for the original image)
4. use S3Fox add-on to delete folders
