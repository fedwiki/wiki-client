/*
 * Uses of plugin getScript to load the security plugin's client code
 */


import plugin from './plugin.cjs';

export default function ( user ) { return plugin.getScript("/security/security.js", () => window.plugins.security.setup(user)); }
