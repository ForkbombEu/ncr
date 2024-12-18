
# 🎮 Quick start

To start using ncr run the following commands

```bash
# download the binary
wget https://github.com/forkbombeu/ncr/releases/latest/download/ncr -O ~/.local/bin/ncr && chmod +x ~/.local/bin/ncr

# checkout this repo
git clone https://github.com/forkbombeu/ncr

# run the server with the example folder
ncr -p 3000 -z ./ncr/tests/fixtures --public-directory ./ncr/public
```