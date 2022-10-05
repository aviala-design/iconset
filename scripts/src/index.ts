import { readFile, writeJSON } from 'fs-extra'
import {
  importDirectory,
  cleanupSVG,
  parseColors,
  isEmptyColor,
  runSVGO,
  IconSet,
} from '@iconify/tools'
import type { IconifyInfo } from '@iconify/types'
import { paramCase } from 'change-case'
import { resolve } from 'path'

const info: IconifyInfo = {
  name: 'Amethyst Clearly',
  author: {
      name: 'Systematize Design',
      url: 'https://github.com/systematize',
  },
  license: {
    title: 'CC'
  },
  height: 308,
  samples: []
}

async function optimize(iconset: IconSet): Promise<IconSet> {
  await iconset.forEach(async (name, type) => {
    if (type !== 'icon') return

    const svg = iconset.toSVG(name)
    if (svg == null) {
      iconset.remove(name)
      return
    }

    const expectedSize = 308

    if (svg.viewBox.height !== expectedSize || svg.viewBox.width !== expectedSize) {
      console.error(
        `Icon ${name} has invalid dimensions: ${svg.viewBox.width} x ${svg.viewBox.height}`
      )
      iconset.remove(name);
      return
    }

    try {
      console.log(`processing icon ${name}`)
      await cleanupSVG(svg)

      await parseColors(svg, {
        defaultColor: 'currentColor',
        callback: (attr, colorStr, color) => (!color || isEmptyColor(color) ? colorStr : 'currentColor'),
        fixErrors: true
      })

      runSVGO(svg, {
        cleanupIDs: '__id_',
        keepShapes: true,
      })
    } catch(e: any) {
      console.error(`Icon ${name} parsing error: `, e?.message ?? e.toString())
      iconset.remove(name);
      return
    }

    iconset.fromSVG(name, svg)
  })
  iconset.info = info
  return iconset
}

async function bootstrap(): Promise<void> {
  const meta = await optimize(await importDirectory(resolve(`../amethyst-clearly/icons/`), { keyword: ({ file }) => paramCase(file) }))
  console.log(meta)
  writeJSON('./output.json', meta, { spaces: 2 })
}

bootstrap()