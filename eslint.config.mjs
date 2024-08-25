import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {languageOptions: { 
    globals: {
      ...globals.browser,
      ...globals.jquery,
    }
  }
  },
  pluginJs.configs.recommended,
];
