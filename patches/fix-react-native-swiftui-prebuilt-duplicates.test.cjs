const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { podspecs, patchSource, patchReactNativeSwiftUiPodspecs } = require('./fix-react-native-swiftui-prebuilt-duplicates.cjs');

// Verbatim from react-native 0.83.1 (the unpatched upstream text).
const UPSTREAM = {
    'ReactApple/RCTSwiftUI/RCTSwiftUI.podspec': [
        'Pod::Spec.new do |s|',
        '  s.name                   = "RCTSwiftUI"',
        '  s.source_files           = "*.{h,m,swift}"',
        '  s.public_header_files    = "*.h"',
        'end',
        '',
    ].join('\n'),
    'ReactApple/RCTSwiftUIWrapper/RCTSwiftUIWrapper.podspec': [
        'Pod::Spec.new do |s|',
        '  s.name                   = "RCTSwiftUIWrapper"',
        '  s.source_files           = "*.{h,m}"',
        '  s.public_header_files    = "*.h"',
        '  s.dependency "RCTSwiftUI"',
        'end',
        '',
    ].join('\n'),
};

test('wraps both podspecs\' sources in podspec_sources, matching react-native main', () => {
    const [swiftUi, wrapper] = podspecs;
    assert.match(patchSource(UPSTREAM[swiftUi.file], swiftUi), /podspec_sources\("\*\.\{h,m,swift\}", ""\)/);
    assert.match(patchSource(UPSTREAM[wrapper.file], wrapper), /podspec_sources\("\*\.\{h,m\}", "\*\.\{h\}"\)/);
});

test('changes nothing else in the podspec', () => {
    for (const spec of podspecs) {
        const out = patchSource(UPSTREAM[spec.file], spec);
        const changed = out.split('\n').filter((line, i) => line !== UPSTREAM[spec.file].split('\n')[i]);
        assert.equal(changed.length, 1, `${spec.file}: exactly one line differs`);
        assert.match(changed[0], /source_files/);
    }
});

test('is idempotent and a no-op on an already-fixed react-native', () => {
    for (const spec of podspecs) {
        const once = patchSource(UPSTREAM[spec.file], spec);
        assert.equal(patchSource(once, spec), once);
    }
    const unrelated = 'Pod::Spec.new { |s| s.source_files = "*.swift" }\n';
    assert.equal(patchSource(unrelated, podspecs[0]), unrelated);
});

test('patches files on disk, reports the count, and does nothing the second time', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-swiftui-'));
    for (const spec of podspecs) {
        const file = path.join(root, 'react-native', spec.file);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, UPSTREAM[spec.file]);
    }
    assert.equal(patchReactNativeSwiftUiPodspecs([root]), 2);
    assert.equal(patchReactNativeSwiftUiPodspecs([root]), 0);
    fs.rmSync(root, { recursive: true, force: true });
});

test('skips roots that do not contain react-native', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-none-'));
    assert.equal(patchReactNativeSwiftUiPodspecs([root]), 0);
    fs.rmSync(root, { recursive: true, force: true });
});
