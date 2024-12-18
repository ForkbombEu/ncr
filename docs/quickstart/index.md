
# 🎮 Quick start

No Code Room (NCR) is a server designed to execute Zencode scripts seamlessly. With ncr, you can quickly set up endpoints
based on Zencode files and serve static files with minimal configuration. It’s perfect for projects utilizing
Zencode logic with a need for an accessible HTTP interface.


To start using ncr, run the following commands:

```bash
# download the binary
wget https://github.com/forkbombeu/ncr/releases/latest/download/ncr -O ~/.local/bin/ncr && chmod +x ~/.local/bin/ncr

# checkout this repo
git clone https://github.com/forkbombeu/ncr

# run the server with the example folder
ncr -p 3000 -z ./ncr/tests/fixtures --public-directory ./ncr/public
```

Now, open http://localhost:3000/docs in your browser. You will see a list of all available endpoints, which correspond
to the Zencode files in the ./tests/fixtures folder. Additionally, static files in the ./public directory will be
accessible, for example, http://localhost:3000/file_example_MP3_700KB.mp3.

For customizing ncr's behavior, check out the [Configuration section](./conf).

Moreover ncr comes with an easy way to:
* check for valid input with [json schema](./../info/schema)
* run automatically some setup contracts with the [.autorun folder](./../info/autorun)
* set more information about the API with a [metadata file](./../info/metadata)
