import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "noˑcodeˑroom",
  description: "No code REST API server based on zencode natural language smart contracts",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Quick start', link: '/quickstart/' },
      { text: 'More Info', link: '/info/' },
    ],

    sidebar: [
      {
        text: 'Quick start',
        items: [
          { text: 'Run', link: '/quickstart/' },
          { text: 'Configuration', link: '/quickstart/conf' },
        ]
      },
      {
        text: 'More info',
        items: [
          { text: 'Schema', link: '/info/schema' },
          { text: 'Openapi and applets', link: '/info/web' },
          { text: 'Autorun', link: '/info/autorun' },
          { text: 'Metadata', link: '/info/metadata' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/forkbombeu/ncr' }
    ]
  }
})
