module.exports = {
    ...require("jaz-ts-utils/prettier.config.js"),
    overrides: [
        {
            files: "src/**/*.{ts,js}",
            options: {
                printWidth: 120,
            },
        },
    ],
};
