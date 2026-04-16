export default ({ config }) => ({
  ...config,
  name: "RideHail",
  slug: "ridehail",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#7C3AED"
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.ridehail.app"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#7C3AED"
    },
    package: "com.ridehail.app",
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "ACCESS_BACKGROUND_LOCATION",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ],
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
      }
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  plugins: [
    "expo-location",
    "expo-image-picker",
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#7C3AED"
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "e7e1dc3f-4ba4-4820-811b-2c1a7e50ed0b"
    }
  }
});
