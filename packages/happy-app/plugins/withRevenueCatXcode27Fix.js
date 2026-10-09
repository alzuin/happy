const { withPodfilePostInstall } = require('./podfilePostInstall');

/**
 * Backports RevenueCat's Xcode 27 compile fix to the pinned RevenueCat pod.
 *
 * Symptom (Xcode 27 beta / newer Swift compiler):
 *
 *   Pods/RevenueCat/Sources/Paywalls/PaywallColor.swift:57:12
 *   Invalid redeclaration of synthesized memberwise 'init(stringRepresentation:)'
 *
 * ...followed by "Command Libtool failed with a nonzero exit code", which is
 * only the knock-on effect of the RevenueCat static library failing to build.
 *
 * Why we patch instead of upgrading: react-native-purchases' PurchasesHybridCommon
 * pins RevenueCat to one exact version. Our react-native-purchases 9.x line
 * resolves RevenueCat 5.65.0 through 5.67.1, and the upstream fix
 * (purchases-ios #6949, "Xcode 27 Beta Compilation Fix") only ships from 5.78.0.
 * Reaching it means a major react-native-purchases 10.x upgrade — a lot of
 * unrelated API surface to take on just to unblock a compile error.
 *
 * The upstream fix is a pure move of one initializer, in one file: the private
 * "designated" init goes from a `private extension` into the struct body, so
 * the compiler no longer sees it clashing with the synthesized memberwise init.
 * Applying that same move to 5.65.0 yields a file byte-identical to 5.78.0's.
 *
 * The patch only fires when the file still has the pre-fix shape, so it is a
 * no-op on a RevenueCat that already contains the fix, and safe to re-run.
 * Once react-native-purchases is upgraded past it, this plugin can be deleted.
 */

const MARKER = '# happy: backport RevenueCat Xcode 27 PaywallColor fix';

// Plain literal strings on purpose: an exact-match move is easier to reason
// about, and to keep correct, than a regular expression.
const SNIPPET = `
    ${MARKER}
    paywall_color = File.join(installer.sandbox.root.to_s, 'RevenueCat', 'Sources', 'Paywalls', 'PaywallColor.swift')
    if File.exist?(paywall_color)
      designated_init = [
        '    /// "Designated" initializer',
        '    private init(stringRepresentation: String, underlyingColor: (any Sendable)?) {',
        '        self.stringRepresentation = stringRepresentation',
        '        self._underlyingColor = underlyingColor',
        '    }',
      ].join("\\n") + "\\n"
      # Pre-fix layout: the init sits in a trailing \`private extension\`...
      misplaced = designated_init + "\\n"
      # ...and the struct body ends right after this stored property.
      struct_anchor = "    fileprivate var _underlyingColor: (any Sendable)?\\n\\n"
      source = File.read(paywall_color)
      if source.include?(misplaced) && source.include?(struct_anchor)
        source = source.sub(misplaced) { '' }
        source = source.sub(struct_anchor) { struct_anchor + designated_init }
        File.chmod(0644, paywall_color)
        File.write(paywall_color, source)
        Pod::UI.puts '[happy] patched RevenueCat PaywallColor.swift for Xcode 27'
      end
    end
`;

function withRevenueCatXcode27Fix(config) {
  return withPodfilePostInstall(config, {
    marker: MARKER,
    snippet: SNIPPET,
    pluginName: 'withRevenueCatXcode27Fix',
  });
}

module.exports = withRevenueCatXcode27Fix;
module.exports.SNIPPET = SNIPPET;
