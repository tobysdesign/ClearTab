import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  StickyNote,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function StyleGuide() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [activeTab, setActiveTab] = useState("typography");

  const tabs = [
    { id: "typography", label: "Typography" },
    { id: "colors", label: "Colors" },
    { id: "components", label: "Components" },
    { id: "widgets", label: "Widget Examples" },
    { id: "spacing", label: "Spacing" }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-text-primary mb-2">Style Guide</h1>
          <p className="text-sm text-text-muted">Design system documentation and component library</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-t transition-colors ${
                activeTab === tab.id
                  ? "bg-muted text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "typography" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Scale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-text-muted mb-2">text-3xl font-light (Main Numbers)</p>
                    <div className="text-3xl font-light text-text-primary">42</div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-2">text-lg font-medium (Secondary Numbers)</p>
                    <div className="text-lg font-medium text-text-primary">$1,250</div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-2">text-sm (Body Text)</p>
                    <div className="text-sm text-text-secondary">This is body text for descriptions</div>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-2">text-xs (Labels & Metadata)</p>
                    <div className="text-xs text-text-muted font-medium">Widget Label</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Text Colors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-text-primary">text-text-primary - Main content</div>
                  <div className="text-text-secondary">text-text-secondary - Secondary content</div>
                  <div className="text-text-muted">text-text-muted - Muted content</div>
                  <div className="text-muted-foreground">text-muted-foreground - System muted</div>
                  <div className="text-foreground">text-foreground - Default foreground</div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "colors" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Color Palette</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-background border rounded"></div>
                      <p className="text-xs">background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-card border rounded"></div>
                      <p className="text-xs">card</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-muted border rounded"></div>
                      <p className="text-xs">muted</p>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-16 bg-border border rounded"></div>
                      <p className="text-xs">border</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Design Principles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Unified Color System</h4>
                    <p className="text-xs text-text-muted">No colored priority badges or status indicators. All elements use muted variants for consistency.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Left-Aligned Design</h4>
                    <p className="text-xs text-text-muted">All content follows left-alignment for consistent reading flow and hierarchy.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Consistent Spacing</h4>
                    <p className="text-xs text-text-muted">24px padding standard across widgets, with borders respecting margins.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "components" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Button>Primary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-2">Interactive Elements</p>
                    <button className="text-xs text-text-muted text-left w-full hover:text-text-secondary transition-colors">
                      Add new item
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Form Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Input Field</label>
                      <Input placeholder="Enter text..." className="h-8 text-sm" />
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
                  </div>
                  <div>
                    <label className="text-xs text-text-muted block mb-1">Textarea</label>
                    <Textarea placeholder="Enter description..." className="text-sm" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox className="text-muted-foreground border-muted-foreground" />
                    <label className="text-xs">Checkbox with muted styling</label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      Priority Badge
                    </Badge>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                      Status Badge
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted">All badges use muted colors for consistency</p>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "widgets" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Header Pattern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-muted-foreground leading-none flex items-center h-4">Widget Title</h3>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-text-muted">Standard widget header with title and action button</p>
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
                    <p className="text-xs text-text-muted">Tab navigation with inline action button (Finance widget pattern)</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Pattern</CardTitle>
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
                    <p className="text-xs text-text-muted">Minimal carousel with left-aligned indicators (Weather widget pattern)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "spacing" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spacing System</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Widget Padding</h4>
                    <div className="bg-muted p-6 rounded border-2 border-dashed border-border">
                      <div className="bg-card p-4 rounded border">
                        <p className="text-xs text-text-muted">24px padding standard</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Border Alignment</h4>
                    <div className="space-y-2">
                      <div className="border-t border-border"></div>
                      <p className="text-xs text-text-muted">Borders respect widget margins</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Checkbox Alignment</h4>
                    <div className="flex items-start space-x-2">
                      <Checkbox className="mt-1.5 text-muted-foreground border-muted-foreground" />
                      <div>
                        <p className="text-xs">6px top margin for proper alignment</p>
                        <p className="text-xs text-text-muted">With checkbox circles muted</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}