#Lambda HelloWorldPromise

与helloworld基本一致,只不过利用了'aws-sdk-promise'

*注意:*
1. don't zip folder but zip content inside the folder, including node_modules folder
2. in then() method, first method is success() and second method is fail()
3. in the success() method, the passed in result is response, which contains data; so use response.data.Body to get the wanted body.
