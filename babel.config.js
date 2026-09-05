module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@/components': './components',
            '@/lib': './lib',
            '@/store': './store',
            '@/hooks': './hooks',
            '@/types': './types',
            '@/constants': './constants',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
