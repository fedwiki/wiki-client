// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */

// module.exports = {};

// make use of plugin getScript to load the security plugin's client code
import * as plugin from './plugin.mjs';

export default user => plugin.getScript("/security/security.js", () => window.plugins.security.setup(user));
