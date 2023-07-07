import FS from 'node:fs'
import { pathToFileURL } from 'node:url'

export default {
  buildConfig: {
    plugins: [
      {
        name: 'import.meta.url',
        setup({ onLoad }) {
          onLoad({ filter: /\.js|\.ts/, namespace: 'file' }, (args) => {
            let code = FS.readFileSync(args.path, 'utf8')
            code = code.replace(
              /new URL\((.*), import\.meta\.url\)/g,
              `new URL(\$1, ${JSON.stringify(pathToFileURL(args.path))})`
            )
            return { contents: code }
          })
        },
      },
    ],
  },
}
