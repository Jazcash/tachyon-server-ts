module.exports = {
  ...require("jaz-ts-utils/prettier.config.js"),
  overrides: [
    {
      files: "src/**/*.vue",
      options: {
        printWidth: 140,
      },
    },
  ],
};
