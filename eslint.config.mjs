import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {ignores: ["outdir/*", "test/*", "scripts/*"]},
  {languageOptions: { 
    globals: {
      ...globals.browser,
      ...globals.jquery,
      ...globals.mocha,
    }
  }
  },
  pluginJs.configs.recommended,
];
