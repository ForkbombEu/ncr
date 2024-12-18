<!--
SPDX-FileCopyrightText: 2024 The Forkbomb Company
SPDX-License-Identifier: AGPL-3.0-or-later
-->

<div align="center">

# noˑcodeˑroom <!-- omit in toc -->

### No code REST API server based on zencode natural language smart contracts <!-- omit in toc -->

</div>

<div id="tocs">

### Table of contents

- [🎮 Quick start](#-quick-start)
- [💾 Build](#-build)
  - [💾🪫 Build on ARM32](#-build-on-arm32)
- [🐋 Docker](#-docker)
- [🔧 Configuration](#-configuration)
- [📋 Testing](#-testing)
- [🐛 Troubleshooting \& debugging](#-troubleshooting--debugging)
- [😍 Acknowledgements](#-acknowledgements)
- [🌐 Links](#-links)
- [👤 Contributing](#-contributing)
- [💼 License](#-license)

</div>

--- 
## 🎮 Quick start

To start using ncr run the following commands

```bash
# download the binary
wget https://github.com/forkbombeu/ncr/releases/latest/download/ncr -O ~/.local/bin/ncr && chmod +x ~/.local/bin/ncr

# checkout this repo
git clone https://github.com/forkbombeu/ncr

# run the server with the example folder
ncr -p 3000 -z ./ncr/tests/fixtures --public-directory ./ncr/public
```

Opening [http://localhost:3000/docs](http://localhost:3000/docs) with your browser to see the result. You will found a list of all the available endpoints, that simply are the zencode files in the `./tests/fixtures` folder. Moreover you will have the possibility to access directly all the files under the `./public` folder, like [http://localhost:3000/file_example_MP3_700KB.mp3](http://localhost:3000/file_example_MP3_700KB.mp3).

**[🔝 back to top](#toc)**

---

## 💾 Build

Ncr comes also in a easy to use executable file. You can build it by running the following command

```bash
git clone https://github.com/forkbombeu/ncr
cd ncr
pnpm i
pnpm build
```

or dowload it from the latest realease from [GitHub](https://github.com/forkbombeu/ncr/releases/latest)

```bash
wget https://github.com/forkbombeu/ncr/releases/latest/download/ncr
chmod +x ncr
```

and run it with the simple command

```bash
./ncr -p 3000 -z ./tests/fixtures --public-directory ./public
```

that will serve the zencode contract under the folder `./tests/fixtures` and the public files under the folder `./public` on http://0.0.0.0:3000.

### 💾🪫 Build on ARM32

NCR builds on Raspberry Pi 4 and 5 (4GB and above) with Raspbian-ARM32. 

You also to set these flags to get it to work:

```bash
export CXXFLAGS="-march=armv7-a -mfloat-abi=hard -mfpu=vfpv3 -mno-unaligned-access"
export CFLAGS="-march=armv7-a -mfloat-abi=hard -mfpu=vfpv3 -mno-unaligned-access"
```
Then build using:

```bash
pnpm raspi32
```

The build will take a couple of hours 😎 

**[🔝 back to top](#toc)**

---

## 🐋 Docker

```
docker pull ghcr.io/forkbombeu/ncr:latest
```

**[🔝 back to top](#toc)**

---

## 🔧 Configuration

Configuration can be done both via CLI or via .env file.

Usage: `ncr [options]`

Options:
 * `-z, --zencode-directory <directory>`  
   env: **ZENCODE_DIR**  
   specify the zencode contracts directory (default: current directory)
 * `--public-directory <directory>`  
   env: **PUBLIC_DIR**  
   specify the static files directory
 * `-p, --port <number>`  
   env: **PORT**  
   specify port number; if unspecified ncr will listen to a random free port (default: 0)
 * `--zenroom-version <string>`  
   env: **ZENROOM_VERSION**  
   specify the version of ZENROOM to interpret the contracts (default: "4.12.0")
 * `--openapi-path <string>`  
   env: **OPENAPI_PATH**  
   specify where to mount the swagger docs (default: "/docs")
 * `--hostname <string>`  
   env: **HOSTNAME**  
   Provide the hostname to serve the server (default: "0.0.0.0")
 * `--template <file>`  
   Provide the html template for the applets (default: "./applet_template.html")
 * `--basepath <string>`  
   env: **BASEPATH**  
   specify the basepath for all APIs (default: "")
 * `-D, --debug`  
   env: **DEBUG**  
   debug (default: false)
 * `-v, --version`  
   show version number


**[🔝 back to top](#toc)**

---

## 📋 Testing

Test can be done with the command

```bash
pnpm i
pnpm test
```

**[🔝 back to top](#toc)**

---

## 🐛 Troubleshooting & debugging

Availabe bugs are reported via [GitHub issues](https://github.com/forkbombeu/ncr/issues).

**[🔝 back to top](#toc)**

---

## 😍 Acknowledgements

Coming soon.

**[🔝 back to top](#toc)**

---

## 🌐 Links

https://forkbomb.solutions

https://dyne.org/

**[🔝 back to top](#toc)**

---

## 👤 Contributing

1. 🔀 [FORK IT](../../fork)
2. ✨ Create your feature branch `git checkout -b feature/branch`
3. 🖋️ Commit your changes `git commit -am 'feat: New feature'`
4. ⬆️ Push your changes `git push origin feature/branch`
5. 🚀 Create a PR `gh pr create --fill`
6. 🙏🏽 Thank you!

**[🔝 back to top](#toc)**

---

## 💼 License

    noˑcodeˑroom - No code REST API server based on zencode
    Copyleft 🄯 2024 The Forkbomb Company, Amsterdam

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation, either version 3 of the
    License, or (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

**[🔝 back to top](#toc)**
