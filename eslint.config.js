// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format

export default [{
  ignores: [
    "docs-and-demos/**/*",
    "cui/**/*",
    ".next/**/*",
    "node_modules/**/*",
    "packages/ui/storybook-static/**/*",
    "test-db.js",
  ],
}, {
  rules: {
    "no-restricted-syntax": "warn",
  },
}];
