import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

export default function StyleGuide() {
  const sections = [
    { id: "typography", label: "Typography" },
    { id: "colors", label: "Colors & Design Tokens" },
    { id: "spacing", label: "Spacing & Layout" },
    { id: "components", label: "Components" },
    { id: "widgets", label: "Widget Patterns" }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar Navigation */}
      <div className="w-80 fixed left-0 top-0 h-full bg-card border-r border-border overflow-y-auto z-10">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-xl font-light text-text-primary mb-1">Design System</h1>
            <p className="text-xs text-text-muted">Complete style guide & specifications</p>
          </div>
          
          <nav className="space-y-1 mb-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full text-left px-3 py-2 text-sm rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Design Tokens Quick Reference */}
          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-medium text-text-primary mb-4">Quick Reference</h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <p className="text-text-muted mb-2 font-medium">Typography Scale</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono">text-3xl</span>
                    <span className="text-text-muted">48px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">text-lg</span>
                    <span className="text-text-muted">18px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">text-sm</span>
                    <span className="text-text-muted">14px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">text-xs</span>
                    <span className="text-text-muted">12px</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-text-muted mb-2 font-medium">Spacing</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono">Widget padding</span>
                    <span className="text-text-muted">24px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">Button height</span>
                    <span className="text-text-muted">32px (h-8)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">Icon button</span>
                    <span className="text-text-muted">24px (h-6 w-6)</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-text-muted mb-2 font-medium">Border Radius</p>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="font-mono">rounded</span>
                    <span className="text-text-muted">6px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">rounded-lg</span>
                    <span className="text-text-muted">8px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono">rounded-full</span>
                    <span className="text-text-muted">9999px</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-text-muted mb-2 font-medium">CSS Variables</p>
                <div className="space-y-1">
                  <div className="font-mono text-[10px] text-text-muted">
                    --background: 210 11% 98%
                  </div>
                  <div className="font-mono text-[10px] text-text-muted">
                    --card: 0 0% 100%
                  </div>
                  <div className="font-mono text-[10px] text-text-muted">
                    --muted: 210 11% 96%
                  </div>
                  <div className="font-mono text-[10px] text-text-muted">
                    --border: 214 13% 91%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className="ml-80 flex-1 h-screen"
        style={{ 
          overflowY: 'scroll', 
          overflowX: 'hidden',
          maxHeight: '100vh'
        }}
      >
        <div className="max-w-4xl mx-auto p-8 pb-16">
          <div className="space-y-16">
            
            {/* Typography Section */}
            <section id="typography" className="space-y-8">
              <div>
                <h2 className="text-3xl font-light text-text-primary mb-2">Typography</h2>
                <p className="text-sm text-text-muted">Font scales, weights, and hierarchy</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Typography Scale</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-mono text-xs text-text-muted">text-3xl font-light</span>
                        <span className="text-xs text-text-muted">48px / 300 weight</span>
                      </div>
                      <div className="text-3xl font-light text-text-primary">42</div>
                      <p className="text-xs text-text-muted mt-1">Main numbers in widgets</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-mono text-xs text-text-muted">text-lg font-medium</span>
                        <span className="text-xs text-text-muted">18px / 500 weight</span>
                      </div>
                      <div className="text-lg font-medium text-text-primary">$1,250</div>
                      <p className="text-xs text-text-muted mt-1">Secondary numbers</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-mono text-xs text-text-muted">text-sm</span>
                        <span className="text-xs text-text-muted">14px / 400 weight</span>
                      </div>
                      <div className="text-sm text-text-secondary">This is body text for descriptions</div>
                      <p className="text-xs text-text-muted mt-1">Body text and descriptions</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="font-mono text-xs text-text-muted">text-xs font-medium</span>
                        <span className="text-xs text-text-muted">12px / 500 weight</span>
                      </div>
                      <div className="text-xs text-text-muted font-medium">Widget Label</div>
                      <p className="text-xs text-text-muted mt-1">Labels and metadata</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Text Colors</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-text-primary mb-1">text-text-primary</div>
                        <div className="font-mono text-xs text-text-muted">Main content color</div>
                      </div>
                      <div>
                        <div className="text-text-secondary mb-1">text-text-secondary</div>
                        <div className="font-mono text-xs text-text-muted">Secondary content</div>
                      </div>
                      <div>
                        <div className="text-text-muted mb-1">text-text-muted</div>
                        <div className="font-mono text-xs text-text-muted">Muted content & labels</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">text-muted-foreground</div>
                        <div className="font-mono text-xs text-text-muted">System muted elements</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Colors & Design Tokens Section */}
            <section id="colors" className="space-y-8">
              <div>
                <h2 className="text-3xl font-light text-text-primary mb-2">Colors & Design Tokens</h2>
                <p className="text-sm text-text-muted">Color palette, CSS variables, and design principles</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Color Palette</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="w-full h-16 bg-background border rounded-lg"></div>
                        <div className="text-xs">
                          <div className="font-medium">background</div>
                          <div className="font-mono text-text-muted">hsl(210, 11%, 98%)</div>
                          <div className="font-mono text-text-muted">#F5F7FA</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-16 bg-card border rounded-lg"></div>
                        <div className="text-xs">
                          <div className="font-medium">card</div>
                          <div className="font-mono text-text-muted">hsl(0, 0%, 100%)</div>
                          <div className="font-mono text-text-muted">#FFFFFF</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-16 bg-muted border rounded-lg"></div>
                        <div className="text-xs">
                          <div className="font-medium">muted</div>
                          <div className="font-mono text-text-muted">hsl(210, 11%, 96%)</div>
                          <div className="font-mono text-text-muted">#F1F4F7</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-16 bg-border border-2 rounded-lg"></div>
                        <div className="text-xs">
                          <div className="font-medium">border</div>
                          <div className="font-mono text-text-muted">hsl(214, 13%, 91%)</div>
                          <div className="font-mono text-text-muted">#E2E8F0</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Design Principles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Unified Color System</h4>
                      <p className="text-xs text-text-muted">No colored priority badges or status indicators. All elements use muted variants for consistency and accessibility.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Left-Aligned Design</h4>
                      <p className="text-xs text-text-muted">All content follows left-alignment for consistent reading flow and visual hierarchy.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Consistent Spacing</h4>
                      <p className="text-xs text-text-muted">24px padding standard across widgets, with borders respecting content margins.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Minimal Visual Noise</h4>
                      <p className="text-xs text-text-muted">Removed hash symbols (#) from widget headers for cleaner typography.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Spacing & Layout Section */}
            <section id="spacing" className="space-y-8">
              <div>
                <h2 className="text-3xl font-light text-text-primary mb-2">Spacing & Layout</h2>
                <p className="text-sm text-text-muted">Spacing scale, measurements, and layout principles</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Spacing Scale</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Widget Measurements</h4>
                      <div className="bg-muted p-6 rounded-lg border-2 border-dashed border-border">
                        <div className="bg-card p-6 rounded-lg border text-center">
                          <p className="text-xs text-text-muted font-mono">24px padding standard</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mt-2">Standard widget padding: 24px (p-6)</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Element Heights</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="h-8 bg-muted rounded px-3 flex items-center">
                            <span className="text-xs">Input/Button</span>
                          </div>
                          <span className="font-mono text-xs text-text-muted">32px (h-8)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-6 w-6 bg-muted rounded flex items-center justify-center">
                            <MoreHorizontal className="h-3 w-3" />
                          </div>
                          <span className="font-mono text-xs text-text-muted">24px (h-6 w-6)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-muted rounded px-2 flex items-center">
                            <span className="text-xs">Header</span>
                          </div>
                          <span className="font-mono text-xs text-text-muted">16px (h-4)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alignment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Checkbox Alignment</h4>
                      <div className="flex items-start space-x-2">
                        <Checkbox className="mt-1.5 text-muted-foreground border-muted-foreground" />
                        <div>
                          <p className="text-xs">6px top margin for proper alignment</p>
                          <p className="text-xs text-text-muted font-mono">mt-1.5 = 6px</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Border Alignment</h4>
                      <div className="space-y-2">
                        <div className="border-t border-border"></div>
                        <p className="text-xs text-text-muted">Borders respect content margins, not widget edges</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Interactive Elements</h4>
                      <div className="space-y-2">
                        <button className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors">
                          Add new item
                        </button>
                        <p className="text-xs text-text-muted">Left-aligned, full-width interactive elements</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Components Section */}
            <section id="components" className="space-y-8">
              <div>
                <h2 className="text-3xl font-light text-text-primary mb-2">Components</h2>
                <p className="text-sm text-text-muted">UI components with specifications</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Buttons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Button>Primary Button</Button>
                          <span className="font-mono text-xs text-text-muted">h-10 px-4 py-2</span>
                        </div>
                        <p className="text-xs text-text-muted">40px height, 6px border radius</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Button variant="outline">Outline Button</Button>
                          <span className="font-mono text-xs text-text-muted">border-input</span>
                        </div>
                        <p className="text-xs text-text-muted">1px border, transparent background</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                          <span className="font-mono text-xs text-text-muted">h-6 w-6 p-0</span>
                        </div>
                        <p className="text-xs text-text-muted">24x24px icon button</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Input Field</label>
                      <Input placeholder="Enter text..." className="h-8 text-sm" />
                      <p className="text-xs text-text-muted mt-1 font-mono">h-8 = 32px height</p>
                    </div>
                    
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Select</label>
                      <Select>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Choose option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option1">Option 1</SelectItem>
                          <SelectItem value="option2">Option 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Textarea</label>
                      <Textarea placeholder="Enter description..." className="text-sm" />
                      <p className="text-xs text-text-muted mt-1">Min height 60px, auto-resize</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Badges</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                            Priority Badge
                          </Badge>
                          <span className="font-mono text-xs text-text-muted">rounded-md</span>
                        </div>
                        <p className="text-xs text-text-muted">All badges use muted colors for consistency</p>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                          Status Badge
                        </Badge>
                        <p className="text-xs text-text-muted mt-1">6px border radius, 1px border</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interactive Elements</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Widget Action Buttons</h4>
                      <div className="border-t border-border/50 pt-3">
                        <button className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors">
                          Add new task
                        </button>
                      </div>
                      <div className="border-t border-border/50 pt-3 mt-2">
                        <button className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors">
                          Add new note
                        </button>
                      </div>
                      <div className="text-xs text-text-muted mt-3 space-y-1">
                        <p className="font-mono">border-t border-border/50</p>
                        <p className="font-mono">pt-3 = 12px top padding</p>
                        <p className="font-mono">text-xs = 12px font size</p>
                        <p>Left-aligned, full-width, positioned at widget bottom</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Hover States</h4>
                      <div className="space-y-2">
                        <button className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                          Hover for color change
                        </button>
                        <p className="text-xs text-text-muted font-mono">transition-colors (150ms)</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Focus States</h4>
                      <Input placeholder="Focus me" className="h-8 text-sm" />
                      <p className="text-xs text-text-muted mt-1">2px ring offset, ring-ring color</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Widget Patterns Section */}
            <section id="widgets" className="space-y-8">
              <div>
                <h2 className="text-3xl font-light text-text-primary mb-2">Widget Patterns</h2>
                <p className="text-sm text-text-muted">Reusable widget layouts and patterns</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Standard Widget Header</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Widget Title</h3>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-text-muted space-y-1">
                        <p className="font-mono">h-4 = 16px header height</p>
                        <p className="font-mono">text-sm = 14px title</p>
                        <p className="font-mono">text-muted-foreground color</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tab Navigation Pattern</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-1">
                          <button className="px-3 py-1 text-xs rounded bg-muted text-foreground">
                            Active Tab
                          </button>
                          <button className="px-3 py-1 text-xs rounded text-muted-foreground hover:text-foreground">
                            Inactive Tab
                          </button>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-text-muted">Finance widget pattern with inline action button</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Layout Pattern</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-left">
                        <div className="text-xs text-text-muted font-medium mb-2">Label</div>
                        <div className="text-3xl font-light text-text-primary">
                          42
                        </div>
                        <div className="text-sm text-text-secondary mb-3">
                          description
                        </div>
                        <div className="text-xs text-text-muted">
                          additional context
                        </div>
                      </div>
                      <div className="border-t border-border/50 pt-3">
                        <button className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors">
                          Add new item
                        </button>
                      </div>
                      <p className="text-xs text-text-muted">Standard widget content hierarchy</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Carousel Pattern</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Weather</h3>
                        <div className="flex items-center space-x-1">
                          <button className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                          <button className="h-4 w-4 rounded flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-start space-x-1">
                        <button className="w-1.5 h-1.5 rounded-full bg-foreground" />
                        <button className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      </div>
                      <div className="text-xs text-text-muted space-y-1">
                        <p className="font-mono">16x16px navigation buttons</p>
                        <p className="font-mono">6x6px indicators</p>
                        <p>Left-aligned indicators (Weather widget)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}