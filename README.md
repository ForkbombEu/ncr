# noˑcodeˑroom

### No code REST API server based on zencode natural language smart contracts


## Metadata Attributes


| Attribute | Description | Default Value |
| --- | --- | --- |
| `http_headers` | Used to specify the HTTP headers. | `false` |
| `error_code` | Used to specify the error code. | `'500'` |
| `success_code` | Used to specify the success code. | `'200'` |
| `success_description` | Used to specify the success description in openApi. | `'The zencode execution output, splitted by newline'` |
| `error_description` | Used to specify the error description. | `'Zenroom execution error'` |
| `content_type` | Used to specify the content type. | `'application/json'` |
| `disable_get` | Used to disable the GET method. | `false` |
| `disable_post` | Used to disable the POST method. | `false` |
| `success_content_type` | Used to specify the content type for successful responses. | `'application/json'` |
| `error_content_type` | Used to specify the content type for error responses. | `'plain/text'` |
| `examples` | Used to provide examples. | `{}` |
| `tags` | Used to specify the tags. | `['📑 Zencodes']` |
| `hidden` | Used to hide the endpoint. | `false` |
| `hide_from_openapi` | Used to hide the endpoint from OpenAPI documentation. | `false` |