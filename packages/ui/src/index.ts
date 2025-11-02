// Core components - lightweight and essential
export { Button, buttonVariants } from "./components/button/button";
export type { ButtonProps } from "./components/button/button";
export {
  WidgetContainer,
  type WidgetContainerProps,
  WidgetContent,
  type WidgetContentProps,
  WidgetHeader,
  type WidgetHeaderProps,
} from "./components/widget";

export {
  BrandedLoader,
  type BrandedLoaderProps,
  type BrandedLoaderSize,
  WidgetLoader,
  type WidgetLoaderProps,
} from "./components/loader";

// Essential UI components
export { AddButton } from "./components/ui/add-button";
export { EmptyState } from "./components/ui/empty-state";
export { Checkbox } from "./components/ui/checkbox";
export { CharcoalWave } from "./components/ui/charcoal-wave";
export { Toaster } from "./components/ui/toaster";
export { useToast } from "./components/ui/use-toast";
export { ClientOnly } from "./components/ui/safe-motion";
export { Input } from "./components/ui/input";
export { LoginWidget } from "./components/ui/login-widget";
export type { LoginWidgetProps } from "./components/ui/login-widget";

// Lightweight replacements for heavy components
export { SimpleDropdown, SimpleDropdownItem, SimpleDropdownSeparator } from "./components/ui/simple-dropdown";

// Keep tooltip for now (used in multiple places)
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./components/ui/tooltip";

// Heavy components - import individually when needed
// export { ActionsMenu } from "./components/ui/actions-menu";
// export { TooltipProvider, Tooltip } from "./components/ui/tooltip";
// export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
// export { DatePicker } from "./components/ui/date-picker";
// export { DateRangePicker } from "./components/ui/date-range-picker";
// export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./components/ui/dialog";
// export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
// export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
// export { Dock } from "./components/ui/dock";
// export { Calendar } from "./components/ui/calendar";
// export { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
