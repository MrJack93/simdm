import * as React from "react"

import { cn } from "@/lib/utils"

const InputGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group"
    className={cn(
      "relative flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors",
      "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}
    {...props}
  />
))
InputGroup.displayName = "InputGroup"

const InputGroupAddon = React.forwardRef(
  ({ className, align = "start", ...props }, ref) => (
    <div
      ref={ref}
      data-slot="input-group-addon"
      className={cn(
        "flex items-center text-muted-foreground shrink-0",
        align === "start" && "mr-1",
        align === "end" && "ml-1",
        className
      )}
      {...props}
    />
  )
)
InputGroupAddon.displayName = "InputGroupAddon"

const InputGroupInput = React.forwardRef(({ className, ...props }, ref) => (
  <input
    ref={ref}
    data-slot="input-group-input"
    className={cn(
      "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none min-w-0",
      className
    )}
    {...props}
  />
))
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="input-group-textarea"
    className={cn(
      "flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none min-w-0 resize-none",
      className
    )}
    {...props}
  />
))
InputGroupTextarea.displayName = "InputGroupTextarea"

const InputGroupText = React.forwardRef(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="input-group-text"
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
InputGroupText.displayName = "InputGroupText"

const InputGroupButton = React.forwardRef(
  ({ className, variant = "ghost", size = "icon-sm", ...props }, ref) => (
    <button
      ref={ref}
      data-slot="input-group-button"
      className={cn(
        "inline-flex items-center justify-center shrink-0 rounded-md text-sm font-medium transition-colors",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        size === "icon-sm" && "h-6 w-6",
        size === "icon" && "h-8 w-8",
        className
      )}
      {...props}
    />
  )
)
InputGroupButton.displayName = "InputGroupButton"

export { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea, InputGroupText, InputGroupButton }
