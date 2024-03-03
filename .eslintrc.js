module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: "standard",
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    semi: "off",
    quotes: "off",
    "comma-dangle": "off",
    "space-before-function-paren": "off",
  },
};
