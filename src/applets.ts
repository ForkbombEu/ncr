// SPDX-FileCopyrightText: 2024-2025 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { config } from './cli.js';
import { readFileSync } from 'fs';

const fileName = config.template;
const proctoroom = `
<!doctype html>
<html lang="en" class="text-xs md:text-lg">
	<head>
		<meta charset="utf-8" />
		<title>noˑcodeˑroom &mdash; <%= title %></title>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<script src="https://cdn.jsdelivr.net/npm/@json-editor/json-editor@latest/dist/jsoneditor.min.js"></script>
		<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
		<script src="https://cdn.jsdelivr.net/npm/cash-dom/dist/cash.min.js"></script>
		<script type="module" src="https://cdn.jsdelivr.net/npm/@slangroom/browser"></script>
		<link rel="stylesheet" href="https://unpkg.com/spectre.css/dist/spectre-icons.min.css" />

		<script>
			tailwind.config = {
				theme: {
					extend: {
						backgroundSize: {
							'300%': '300%'
						},
						fontFamily: {
							sans: ['Onest Variable']
						},
						animation: {
							gradient: 'animatedgradient 6s ease infinite alternate',
							slide: 'slide 12.5s cubic-bezier(0.83, 0, 0.17, 1) infinite'
						},
						keyframes: {
							animatedgradient: {
								'0%': { backgroundPosition: '0% 50%' },
								'50%': { backgroundPosition: '100% 50%' },
								'100%': { backgroundPosition: '0% 50%' }
							},
							slide: {
								'0%, 16%': {
									transform: 'translateY(0%)'
								},
								'20%, 36%': {
									transform: 'translateY(-16.66%)'
								},
								'40%, 56%': {
									transform: 'translateY(-33.33%)'
								},
								'60%, 76%': {
									transform: 'translateY(-50%)'
								},
								'80%, 96%': {
									transform: 'translateY(-66.66%)'
								},
								'100%': {
									transform: 'translateY(-83.33%)'
								}
							}
						}
					}
				},
				plugins: []
			};
		</script>
	</head>
	<body
		class="border-double font-sans antialised font-extrabold text-xl flex flex-col h-full min-h-screen border-[26px] p-8 border-black"
	>
		<main class="flex-grow">
			<h1 class="text-6xl font-black">
				<span
					class="bg-gradient-to-r from-red-500 via-blue-500 to-green-400 text-transparent bg-clip-text bg-300% animate-gradient"
				>
					noˑcodeˑroom
				</span>
				&mdash; <%= title %>
			</h1>
			<div hx-ext="response-targets">
				<form id="params">
					<div id="form"></div>
					<div class="flex pl-2 pt-2 my-4">
						<button class="bg-black text-white font-bold w-full lg:w-fit" id="execute">
							<span
								class="block -translate-x-2 -translate-y-2 border-2 border-black bg-red-500 text-xl p-2 hover:-translate-y-3 active:translate-x-0 active:translate-y-0 transition-all"
							>
								Press this
							</span>
						</button>
						<div class="ml-4 h-8 w-10 animate-bounce htmx-indicator hidden">
							<div class="mx-auto h-8 w-8 animate-pulse rounded-full bg-gray-300"></div>
							<span class="absolute flex h-6 w-6 animate-spin">
								<span class="h-4 w-4 rounded-full bg-gray-300"></span>
							</span>
						</div>
					</div>
				</form>
				<pre id="response" class="overflow-auto max-h-[30rem] text-sm mb-4"></pre>
				<pre id="error" class="overflow-auto max-h-[30rem] text-sm mb-4"></pre>
			</div>
		</main>
		<section>
			<details class="text-slate-600">
				<summary>contract</summary>
				<pre id="contract" class="overflow-auto max-h-[30rem] text-sm mb-4"><%= contract %></pre>
			</details>
		</section>
		<footer>
			<!-- https://cruip.com/creating-a-sliding-text-animation-with-tailwind-css/ -->
			<div class="font-extrabold text-3xl text-opacity-60 lg:text-center bg-red-500 p-4">
				Explore
				<span
					class="text-white underline inline-flex flex-col h-[calc(theme(fontSize.3xl)*theme(lineHeight.tight))] md:h-[calc(theme(fontSize.4xl)*theme(lineHeight.tight))] overflow-hidden"
				>
					<ul class="block animate-slide text-left leading-tight [&_li]:block">
						<li>
							<a href="https://apiroom.net" target="_blank">Apiroom</a>
						</li>
						<li>
							<a href="https://forkbomb.solutions/solution/didroom/" target="_blank"> DIDroom </a>
						</li>
						<li>
							<a
								href="https://forkbomb.solutions/solution/w3c-did-federate-service/"
								target="_blank"
							>
								W3C DID
							</a>
						</li>
						<li>
							<a href="https://forkbomb.solutions/solution/zenbridge/" target="_blank">
								Zenbridge
							</a>
						</li>
						<li>
							<a href="https://forkbomb.solutions/component/zenswarm-oracles/" target="_blank">
								Zenswarm
							</a>
						</li>
						<li>&nbsp;</li>
					</ul>
				</span>
				in the Zenroom ecosystem
			</div>
			<div class="pt-4">
				<div class="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
					<div>
						Deploy this PWA to the <br />
						<ul class="underline">
							<li>
								<a href="https://docs.pwabuilder.com/#/builder/android"> Google Play Store </a>
							</li>
							<li>
								<a href="https://docs.pwabuilder.com/#/builder/app-store"> iOS App Store </a>
							</li>
							<li>
								<a href="https://docs.pwabuilder.com/#/builder/windows"> Microsft Store </a>
							</li>
						</ul>
					</div>
					<div>
						crafted with ❤️‍🔥 by
						<a href="https://dyne.org" class="text-red-500 underline"> dyne.org </a>
						hackers
					</div>
				</div>
			</div>
		</footer>
		<script>
			const contract = String(\`<%= contract %>\`);
			const schema = String(\`<%= schema %>\`);

			const highlight = (json) => {
				json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				return json.replace(
					/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
					function (match) {
						var cls = 'number';
						if (/^"/.test(match)) {
							if (/:$/.test(match)) {
								cls = 'key';
							} else {
								cls = 'string';
							}
						} else if (/true|false/.test(match)) {
							cls = 'boolean';
						} else if (/null/.test(match)) {
							cls = 'null';
						}
						return '<span class="' + cls + '">' + match + '</span>';
					}
				);
			};

			const editor = new JSONEditor(document.getElementById('form'), {
				schema: JSON.parse(schema),
				compact: true,
				disable_collapse: true,
				disable_edit_json: false,
				disable_properties: true,
				required_by_default: true,
				show_errors: 'interaction',
				use_name_attributes: false,
				theme: 'tailwind',
				iconlib: 'spectre'
			});

			$(document).ready(() => {
				$('#execute').on('click', async (e) => {
					$('.htmx-indicator').show();
					e.preventDefault();
					$('#error').html('');
					$('#response').html('');
					try {
						const data = editor.getValue();
						const response = fetch('\${endpoint}', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(data)
						}).then(async (result) => {
							const o = await result.json();
							$('#response').html(highlight(JSON.stringify(o, null, 3)));
							console.log(JSON.stringify(result, null, 4));
						});
						$('#error').html('');
					} catch (e) {
						$('#error').html(e);
					}
					$('.htmx-indicator').hide();
				});
			});
		</script>
		<style>
			/* onest-latin-wght-normal */
			@font-face {
				font-family: 'Onest Variable';
				font-style: normal;
				font-display: swap;
				font-weight: 100 900;
				src: url(https://cdn.jsdelivr.net/fontsource/fonts/onest:vf@latest/latin-wght-normal.woff2)
					format('woff2-variations');
				unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304,
					U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
					U+FEFF, U+FFFD;
			}
			div[data-theme='html'] .je-indented-panel.je-indented-panel {
				border: none;
				padding: 0px;
				margin: 0px;
			}
			.form-control > input {
				border-color: black;
				border-width: 2px;
			}
			.htmx-added {
				outline-color: #22c55e;
				outline-width: 8px;
				outline-style: solid;
			}
			.je-header {}
			.je-object__container {
				border: none;
			}
			.string {
				color: violet;
			}
			.number {
				color: darkorange;
			}
			.boolean {
				color: blue;
			}
			.null {
				color: magenta;
			}
			.key {
				color: red;
			}
		</style>
	</body>
</html>
`;
const getTemplate = () => {
	try {
		return readFileSync(fileName, 'utf-8');
	} catch {
		return proctoroom;
	}
};

export const template = getTemplate();
