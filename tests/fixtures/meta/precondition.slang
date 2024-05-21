# from header
Given I have a 'string dictionary' named 'http headers'
# from data
Given I have a 'string' named 'hello'
# from key
Given I have a 'string' named 'condition_1'
and I have a 'string' named 'condition_2'

When I pickup from path 'http_headers.request.test'
and I verify 'test' is equal to 'condition_1'
and I verify 'hello' is equal to 'condition_2'

Then print the string 'ok'
