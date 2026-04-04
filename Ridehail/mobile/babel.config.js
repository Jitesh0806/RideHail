module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@services': './src/services',
          '@store': './src/store',
          '@screens': './src/screens',
          '@hooks': './src/hooks',
          '@types': './src/types',
          '@navigation': './src/navigation',
          '@components': './src/components',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
