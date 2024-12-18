
# 📐 Schemas

Ncr enhances input safety by allowing you to define accepted input using
[JSON Schemas](https://json-schema.org/overview/what-is-jsonschema).
Each Zencode contract (`.zen` file) can be paired with a `.schema.json` file that
contains the corresponding schema.

Schemas serve two main purposes:
1. **Safety checks** – ensuring that only valid inputs are accepted.
2. **OpenAPI and applet documentation** – providing structure for both
   the API documentation and applet interfaces.

## Example of json schema
```json
{
  "type": "object",
  "properties": {
    "Signer": {
      "type": "object",
      "properties": {
        "mldsa44_public_key": {
          "type": "string"
        }
      },
      "required": [
        "mldsa44_public_key"
      ]
    },
    "message": {
      "type": "string"
    },
    "mldsa44_signature": {
      "type": "string"
    }
  },
  "required": [
    "Signer",
    "message",
    "mldsa44_signature"
  ]
}
```

This schema will generate structured documentation in both OpenAPI and applet formats.

## OpenAPI Documentation
The OpenAPI input documentation is automatically generated based on the schema.
It will define the expected structure and validation rules for the API requests.

## Applet Documentation
Similarly, the applet interface will be generated based on the schema, ensuring
that the frontend interacts with the contract safely and correctly.

---

If you want to learn more about openapi and applets, check out the
[web interface section](./web).