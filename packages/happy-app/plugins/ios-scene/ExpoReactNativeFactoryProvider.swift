// Copyright 2015-present 650 Industries. All rights reserved.
//
// Adapted from expo/expo (MIT), `sdk-57` branch, packages/expo/ios/AppDelegates/ExpoReactNativeFactoryProvider.swift.
// Expo ships this scene lifecycle support from SDK 57. This app is on SDK 55, so the
// same classes are compiled into the app target instead of coming from the `Expo` module.
// Differences from upstream are limited to what that move requires: `internal import Expo`
// (the app's AppDelegate imports it that way, so a second implicit-level import would be
// ambiguous) and internal rather than public/open visibility. Delete this file together with
// plugins/withIosSceneLifecycle.js after upgrading to SDK 57.0.23+ (or SDK 58+).

internal import Expo
import React

/**
 Conformed to by the application's `AppDelegate` so that the scene delegate can retrieve
 the React Native factory it created during `application(_:didFinishLaunchingWithOptions:)`.

 In the scene-based life cycle the window is created by the scene delegate, but the factory
 is still owned by the app delegate. This protocol is the bridge between the two.
 */
@MainActor
protocol ExpoReactNativeFactoryProvider: AnyObject {
  /// The app's window. The scene delegate creates the window and assigns it here so that code
  /// reading `UIApplication.shared.delegate?.window` keeps working (e.g. expo-system-ui).
  /// This is the same `var window: UIWindow?` the app delegate already declares for `UIApplicationDelegate`.
  var window: UIWindow? { get set }

  /// The factory created in `application(_:didFinishLaunchingWithOptions:)`.
  var reactNativeFactory: RCTReactNativeFactory? { get }

  /// The registered React Native module name. Defaults to `"main"`.
  var reactNativeFactoryModuleName: String { get }
}

extension ExpoReactNativeFactoryProvider {
  var reactNativeFactoryModuleName: String {
    return "main"
  }
}
