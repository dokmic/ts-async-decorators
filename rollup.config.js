import externals from 'rollup-plugin-node-externals';
import dts from 'rollup-plugin-dts';
import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: 'src/index.ts',
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
    plugins: [externals({ deps: true }), typescript({ clean: true })],
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
