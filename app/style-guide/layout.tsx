import Link from 'next/link'
import { Toaster } from '@/components/ui/toaster'

const sections = [
  {
    title: 'Design Tokens',
    items: [
      { name: 'Colors', path: '/style-guide/colors' },
    ]
  },
  {
    title: 'Components',
    items: [
      { name: 'Add Button', path: '/style-guide/add-button' },
      { name: 'Bento Grid', path: '/style-guide/bento-grid' },
      { name: 'Button', path: '/style-guide/button' },
      { name: 'Card', path: '/style-guide/card' },
      { name: 'Charcoal Wave', path: '/style-guide/charcoal-wave' },
      { name: 'Checkbox', path: '/style-guide/checkbox' },
      { name: 'Dialog', path: '/style-guide/dialog' },
      { name: 'Dock', path: '/style-guide/dock' },
      { name: 'Dock Icon', path: '/style-guide/dock-icon' },
      { name: 'Drawer', path: '/style-guide/drawer' },
      { name: 'Editor', path: '/style-guide/editor' },
      { name: 'Expandable Card', path: '/style-guide/expandable-card' },
      { name: 'Globe', path: '/style-guide/globe' },
      { name: 'Input', path: '/style-guide/input' },
      { name: 'Label', path: '/style-guide/label' },
      { name: 'List', path: '/style-guide/list' },
      { name: 'List Header', path: '/style-guide/list-header' },
      { name: 'Pop Over', path: '/style-guide/pop-over' },
      { name: 'Scroll Area', path: '/style-guide/scroll-area' },
      { name: 'Select', path: '/style-guide/select' },
      { name: 'Shortcut Button', path: '/style-guide/shortcut-button' },
      { name: 'Glow Button', path: '/style-guide/glow-button' },
      { name: 'Textarea', path: '/style-guide/textarea' },
      { name: 'Toast', path: '/style-guide/toast' },
      { name: 'Toaster', path: '/style-guide/toaster' },
      { name: 'Tooltip', path: '/style-guide/tooltip' },
      { name: 'Weather Icons', path: '/style-guide/weather-icons' },
      { name: 'Widget', path: '/style-guide/widget' },
    ]
  }
]

export default function StyleGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">
        <h2 className="text-lg font-bold mb-4">Style Guide</h2>
        <nav className="flex flex-col space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                {section.title}
              </h3>
              <div className="flex flex-col space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="text-muted-foreground hover:text-foreground pl-2"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
        <Toaster />
      </main>
    </div>
  )
}