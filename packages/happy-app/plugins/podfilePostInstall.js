const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Shared helper for config plugins that need to run Ruby in the generated
 * Podfile's `post_install do |installer|` block.
 *
 * ios/ is regenerated (and gitignored) by `expo prebuild`, so hand-editing the
 * Podfile does not stick. Plugins re-apply their patch on every prebuild.
 *
 * Each patch is guarded by its own marker comment, which keeps prebuild
 * idempotent and lets several plugins coexist in the same post_install.
 */

const POST_INSTALL = /^(\s*post_install do \|installer\|\s*\n)/m;

function injectPostInstall(contents, { marker, snippet, pluginName }) {
  if (contents.includes(marker)) {
    return contents; // already patched
  }
  if (!POST_INSTALL.test(contents)) {
    throw new Error(
      `${pluginName}: could not find \`post_install do |installer|\` in the generated ` +
      'Podfile. The Expo Podfile template has changed; update this plugin.'
    );
  }
  return contents.replace(POST_INSTALL, `$1${snippet}`);
}

function withPodfilePostInstall(config, options) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfilePath = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const original = fs.readFileSync(podfilePath, 'utf8');
      fs.writeFileSync(podfilePath, injectPostInstall(original, options));
      return cfg;
    },
  ]);
}

module.exports = { injectPostInstall, withPodfilePostInstall };
