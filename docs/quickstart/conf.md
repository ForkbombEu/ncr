
# 🔧 Configuration

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