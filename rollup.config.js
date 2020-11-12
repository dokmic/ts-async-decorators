import dts from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';
import { dependencies } from './package.json';

export default [
  {
    input: 'src/index.ts',
    external: Object.keys(dependencies),
    output: [
      {
        dir: 'lib',
        entryFileNames: '[name].js',
        format: 'cjs',
        sourcemap: true,
        sourcemapExcludeSources: true,
      },
      {
        dir: 'lib',
        entryFileNames: '[name].mjs',
        format: 'esm',
        sourcemap: true,
        sourcemapExcludeSources: true,
      },
    ],
    plugins: [typescript({ clean: true })],
  },
  {
    input: 'src/index.ts',
    output: [
      {
        dir: 'lib',
        entryFileNames: '[name].d.ts',
        format: 'esm',
      },
    ],
    plugins: [dts()],
  },
];
