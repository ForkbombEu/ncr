// SPDX-FileCopyrightText: 2024 The Forkbomb Company
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { config } from './cli.js';

export const devPage = `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@dyne/components/dist/dyne-components/dyne-components.css" />
    <script type="module" src="https://cdn.jsdelivr.net/npm/@dyne/components/dist/dyne-components/dyne-components.esm.js"></script>
  </head>
  <body>
      <dyne-slangroom-editor id="dev">
        <dyne-slangroom-preset-loader slot="topbar-right" editor-id="dev" load-local-presets=false oas-endpoint="${config.basepath}/oas.json"></dyne-slangroom-preset-loader>
      /dyne-slangroom-editor>
  </body>
</html>
`;
