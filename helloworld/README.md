#Lambda HelloWorld

1. login AWS with IAM user and select Lambda in service (Lambda is not available in California region, so select Oregon instead)
2. select 'HelloWorld' in Functions tab
3. upload zipped code in Code subtab
4. select runtime, handler and role in Configuration subtab
  * Lambda provided several predefined roles for us to choose from, like 'lambda_basic_execution', 'lambda_s3_exec_role'. We can choose it based on our requirement, click yes on popped-up prompt, and Lambda will automatically create corresponding role for us.
  * We can also create customized IAM role - I created 'lambda_s3_execution'. For customized role, remember attach correct 'Trust Relationships' and 'Permissions'.
  * Add this trust relationship to make lambda service as a trusted entity to assume the role
  ```javascript
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  }
  ```
  * Add this policy to 'Permissions' to make lambda function be able to access S3 bucket
  ```javascript
  {
    "Version": "2012-10-17",
    "Statement": [
          {
              "Effect": "Allow",
              "Action": [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents"
              ],
              "Resource": "arn:aws:logs:*:*:*"
          },
          {
              "Effect": "Allow",
              "Action": [
                  "s3:GetObject"
              ],
              "Resource": [
                  "arn:aws:s3:::jackyzhao.helloworld/*"
              ]
          }
        ]
    }
  ```
5. Add 'S3:jz-lambda' bucket as Event source (with helloworld/ as prefix) so this lambda function can be triggered by this S3 bucket's ObjectCreate event
6. Upload jacky.txt file into this specific S3 bucket and see logs in CloudWatch via Metrics subtab
