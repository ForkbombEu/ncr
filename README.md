<!--
SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
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
 * `--openapi-info <file>`  
   env: **OPENAPI_INFO**  
   provide the json info for the swagger docs (default: "./openapi_info.json")
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
    Copyleft 🄯 2024-2025 The Forkbomb Company, Amsterdam

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

--- 

<!-- TODO: where to integrate this? Move to some documentation elsewher or try to add it here? -->
## Metadata Attributes <!-- omit in toc -->

Metadata are used in NCR as ancillary files to the _.zen_ and _.keys.json_, to better define behaviour and parameters of the API. The metadata file should have the same name as the _.zen_ it follows, with the extensoin **.metadata.json**, see an example [here](https://github.com/ForkbombEu/DIDroom_microservices/blob/main/authz_server/par.metadata.json). The metadata attributes, with the defualt values are listed below. 

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
| `precondition` | Used to specify a path to a slangroom contract to be used as precondition. | `false` |

