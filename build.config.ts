import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  declaration: true,
  emitCJS: true,
  entries: [
    'src/index'
  ],
  externals: [
    '@vue/shared',
    '@vue/reactivity'
  ]
})
