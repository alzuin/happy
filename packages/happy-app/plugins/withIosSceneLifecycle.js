const fs = require('fs');
const path = require('path');
const { withAppDelegate, withInfoPlist, withXcodeProject, IOSConfig } = require('@expo/config-plugins');

/**
 * Adopts the UIKit scene life cycle on Expo SDK 55.
 *
 * iOS 27 asserts at launch unless the app adopts it. An app linked against the iOS 27
 * SDK (Xcode 27) that still uses the classic UIApplicationDelegate-only life cycle dies
 * before showing a window:
 *
 *   Application failed to launch: UIScene life cycle is required for apps built with
 *   this SDK. See "Transitioning to the UIKit scene-based life cycle" ...
 *
 * Expo only ships scene support from SDK 57 (`expo-build-properties`
 * `ios.enableSceneSupport`, which needs expo >= 57.0.23) and builds it into the
 * template from SDK 58. Nothing is backported to SDK 55 or 56, and Expo's own plugin
 * throws on older SDKs, so a version bump cannot fix this on 55.
 *
 * This plugin does what Expo's SDK 57 plugin does, plus one thing it relies on the
 * runtime for: it compiles Expo's scene classes (copied from expo/expo `sdk-57`, see
 * plugins/ios-scene/) into the app target, because SDK 55's `Expo` module does not
 * contain them. Three edits:
 *   1. Info.plist gets a UIApplicationSceneManifest naming EXExpoAppSceneDelegate.
 *   2. AppDelegate conforms to ExpoReactNativeFactoryProvider and stops creating the
 *      window / starting React Native itself; the scene delegate does both once UIKit
 *      hands it a UIWindowScene.
 *   3. The Swift files are written into the app's group and added as build sources.
 *
 * Every other responsibility (re-feeding URL, Universal Link, life-cycle and quick
 * action events to ExpoAppDelegate's subscribers) lives in the copied classes.
 *
 * Refuses to run on SDK 57 and newer. There Expo ships `EXExpoAppSceneDelegate`
 * itself, and compiling a second class with the same Objective-C name would create a
 * duplicate-class runtime hazard. Remove this plugin (and plugins/ios-scene/) when
 * upgrading.
 */

const SWIFT_FILES = [
  'ExpoAppSceneDelegate.swift',
  'SceneEventForwarder.swift',
  'ExpoReactNativeFactoryProvider.swift',
];

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        // Matches the `@objc(EXExpoAppSceneDelegate)` name, so UIKit finds it without a module prefix.
        UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
      },
    ],
  },
};

const ORIGINAL_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate {';
const SCENE_APP_DELEGATE = 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {';
const FACTORY_ASSIGNMENT = '    reactNativeFactory = factory';
const WINDOW_STATEMENT = /^[ \t]*window = UIWindow\(frame: UIScreen\.main\.bounds\)\r?\n/m;
const START_STATEMENT = /^[ \t]*factory\.startReactNative\([^)]*\)\r?\n/m;
const EMPTY_OS_WRAPPER = /^[ \t]*#if os\(iOS\) \|\| os\(tvOS\)\r?\n[ \t]*#endif\r?\n/m;
const BLANK_LINES_AFTER_FACTORY = new RegExp(`(${FACTORY_ASSIGNMENT}\\r?\\n)(?:[ \\t]*\\r?\\n)+`);

/** The installed `expo` version; `config.sdkVersion` only carries the SDK major. */
function installedExpoVersion(projectRoot) {
  try {
    const pkgPath = require.resolve('expo/package.json', { paths: [projectRoot] });
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch {
    return undefined;
  }
}

function assertSupportedSdk(projectRoot) {
  const version = installedExpoVersion(projectRoot);
  const major = version ? parseInt(version.split('.')[0], 10) : NaN;
  if (Number.isFinite(major) && major >= 57) {
    throw new Error(
      `withIosSceneLifecycle: expo ${version} ships its own UIScene support. Remove this plugin ` +
      '(and plugins/ios-scene/) rather than compiling a second EXExpoAppSceneDelegate. On SDK 57 ' +
      'use expo-build-properties `ios.enableSceneSupport` (needs 57.0.23+); SDK 58+ needs nothing.'
    );
  }
}

function patchAppDelegate(contents) {
  if (contents.includes(SCENE_APP_DELEGATE)) {
    return contents; // already adopted — keep prebuild idempotent
  }
  if (
    !contents.includes(ORIGINAL_APP_DELEGATE) ||
    !WINDOW_STATEMENT.test(contents) ||
    !START_STATEMENT.test(contents)
  ) {
    throw new Error(
      'withIosSceneLifecycle: the generated AppDelegate.swift is not the standard Expo template ' +
      '(expected `class AppDelegate: ExpoAppDelegate`, the `window = UIWindow(...)` line and a ' +
      '`factory.startReactNative(...)` call). Update this plugin for the new template.'
    );
  }
  return contents
    .replace(ORIGINAL_APP_DELEGATE, SCENE_APP_DELEGATE)
    .replace(WINDOW_STATEMENT, '')
    .replace(START_STATEMENT, '')
    .replace(EMPTY_OS_WRAPPER, '')
    .replace(BLANK_LINES_AFTER_FACTORY, '$1\n');
}

function isOurManifest(manifest) {
  return JSON.stringify(manifest) === JSON.stringify(SCENE_MANIFEST);
}

module.exports = function withIosSceneLifecycle(config) {
  config = withAppDelegate(config, (cfg) => {
    assertSupportedSdk(cfg.modRequest.projectRoot);
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withIosSceneLifecycle requires the Swift AppDelegate that Expo SDK 55 generates.');
    }
    cfg.modResults.contents = patchAppDelegate(cfg.modResults.contents);
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    const existing = cfg.modResults.UIApplicationSceneManifest;
    if (existing !== undefined && !isOurManifest(existing)) {
      throw new Error(
        'withIosSceneLifecycle: UIApplicationSceneManifest is already declared by the app. ' +
        'Refusing to overwrite user-owned life cycle configuration.'
      );
    }
    cfg.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    return cfg;
  });

  return withXcodeProject(config, (cfg) => {
    const { projectName, platformProjectRoot } = cfg.modRequest;
    for (const file of SWIFT_FILES) {
      fs.copyFileSync(
        path.join(__dirname, 'ios-scene', file),
        path.join(platformProjectRoot, projectName, file)
      );
      // A no-op when the file is already in the group, so repeated prebuilds do not duplicate it.
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath: `${projectName}/${file}`,
        groupName: projectName,
        project: cfg.modResults,
      });
    }
    return cfg;
  });
};

module.exports.patchAppDelegate = patchAppDelegate;
module.exports.SCENE_MANIFEST = SCENE_MANIFEST;
