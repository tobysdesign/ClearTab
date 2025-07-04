import YooptaEditor, { createYooptaEditor } from '@yoopta/editor'

import Paragraph from '@yoopta/paragraph'
import Blockquote from '@yoopta/blockquote'
import Embed from '@yoopta/embed'
import Image from '@yoopta/image'
import Link from '@yoopta/link'
import Callout from '@yoopta/callout'
import Video from '@yoopta/video'
import File from '@yoopta/file'
import Code from '@yoopta/code'
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list'
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar'
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool'

import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings'
import { BulletedList, NumberedList, TodoList } from '@yoopta/lists'
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks'

const plugins = [
  Paragraph,
  HeadingOne,
  HeadingTwo, 
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
  Embed,
  Image.extend({
    options: {
      async onUpload(file) {
        const data = new FormData()
        data.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        })

        const { url } = await response.json()
        return { src: url }
      },
    },
  }),
  Video.extend({
    options: {
      onUpload: async (file) => {
        const data = new FormData()
        data.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        })

        const { url } = await response.json()
        return { src: url }
      },
    },
  }),
  File.extend({
    options: {
      onUpload: async (file) => {
        const data = new FormData()
        data.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        })

        const { url, name, size } = await response.json()
        return { src: url, name, size }
      },
    },
  }),
]

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender, 
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
}

const marks = [Bold, Italic, CodeMark, Underline, Strike, Highlight]

export { plugins, marks, TOOLS } 