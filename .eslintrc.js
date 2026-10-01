// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  root: true,
  extends: ["expo"],
  ignorePatterns: ["/dist/*", "/node_modules/*"],
  rules: {
    "import/order": [
      "warn",
      { "groups": [["builtin", "external"], ["internal", "parent", "sibling", "index"]] }
    ]
  }
};
