const base = require("@mendix/pluggable-widgets-tools/configs/prettier.base.json");

module.exports = {
    ...base,
    "printWidth": 160,
    plugins: [require.resolve("@prettier/plugin-xml")],
};
