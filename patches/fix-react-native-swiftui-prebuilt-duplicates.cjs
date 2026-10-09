/**
 * React Native 0.83 compiles its SwiftUI interop pods (RCTSwiftUI, RCTSwiftUIWrapper)
 * from source even when the app uses the prebuilt React.xcframework, which
 * already contains the same Swift module. Expo SDK 55 enables the prebuilt by default
 * (`RCT_USE_PREBUILT_RNCORE=1` unless `ios.buildReactNativeFromSource` is set), so the
 * app ends up with two copies of every class, and iOS logs this at launch:
 *
 *   objc[...]: Class _TtC10RCTSwiftUI23RCTSwiftUIContainerView is implemented in both
 *   .../Frameworks/React.framework/React and .../Happydev.debug.dylib. This may cause
 *   spurious casting failures and mysterious crashes. One of the duplicates must be
 *   removed or renamed.
 *
 * Confirmed on the built artifacts: the prebuilt React framework exports 271 RCTSwiftUI
 * symbols, while Podfile.lock also installs RCTSwiftUI and RCTSwiftUIWrapper from
 * node_modules/react-native/ReactApple. `React-RCTFabric` ships headers only in prebuilt
 * mode but still declares `s.dependency "RCTSwiftUIWrapper"`, which is what pulls them in.
 *
 * Upstream fixed this on react-native `main` by wrapping both podspecs' sources in
 * `podspec_sources(from_source, for_prebuilt)`, which yields no compiled sources in
 * prebuilt mode (only the framework's copy exists) and the unchanged sources when
 * building from source. 0.83.1 through 0.83.10 still carry the unwrapped lines, so a
 * patch release does not help. This backports that exact change, and is a no-op once
 * a react-native release contains it.
 */
const fs = require('fs');
const path = require('path');

const podspecs = [
    {
        file: 'ReactApple/RCTSwiftUI/RCTSwiftUI.podspec',
        before: '  s.source_files           = "*.{h,m,swift}"',
        after: '  s.source_files           = podspec_sources("*.{h,m,swift}", "")',
    },
    {
        file: 'ReactApple/RCTSwiftUIWrapper/RCTSwiftUIWrapper.podspec',
        before: '  s.source_files           = "*.{h,m}"',
        after: '  s.source_files           = podspec_sources("*.{h,m}", "*.{h}")',
    },
];

/** Returns `source` with the unwrapped line replaced; unchanged if already fixed or unrecognised. */
function patchSource(source, { before, after }) {
    return source.includes(before) ? source.replace(before, after) : source;
}

function patchReactNativeSwiftUiPodspecs(
    nodeModulesRoots = [
        path.resolve(__dirname, '..', 'node_modules'),
        path.resolve(__dirname, '..', 'packages/happy-app/node_modules'),
    ]
) {
    let patched = 0;
    for (const nodeModulesRoot of nodeModulesRoots) {
        for (const spec of podspecs) {
            const podspecPath = path.join(nodeModulesRoot, 'react-native', spec.file);
            if (!fs.existsSync(podspecPath)) continue;
            const original = fs.readFileSync(podspecPath, 'utf8');
            const updated = patchSource(original, spec);
            if (updated !== original) {
                fs.writeFileSync(podspecPath, updated, 'utf8');
                patched++;
            }
        }
    }
    if (patched > 0) {
        console.log(`[patch] Fixed duplicate RCTSwiftUI classes with prebuilt React Native (${patched} file(s))`);
    }
    return patched;
}

module.exports = { podspecs, patchSource, patchReactNativeSwiftUiPodspecs };
