import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { ro } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Weekday({ children, ...props }) {
  return (
    <th {...props}>
      {children}
    </th>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  locale = ro,
  formatters,
  components,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4 w-full",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-[var(--color-text-primary)]",
        nav: "flex items-center gap-1 absolute inset-x-0 top-0",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity duration-200"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity duration-200"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday: cn(
          "flex-1 text-center rounded-md font-medium text-[0.75rem] md:text-[0.8rem] py-2 text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)]"
        ),
        week: "flex w-full",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].range_end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range_end)]:rounded-r-md [&:has(>.day-range_start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-full md:h-10 p-0 font-normal aria-selected:opacity-100 rounded-sm hover:bg-[var(--color-bg-secondary)] transition-colors duration-150"
        ),
        selected:
          "bg-[var(--color-accent)] text-[var(--color-on-primary)] hover:bg-[var(--color-accent-hover)] focus:bg-[var(--color-accent)]",
        today: "bg-[var(--color-info-bg)] text-[var(--color-info)] font-semibold",
        outside:
          "day-outside text-[var(--color-text-tertiary)] aria-selected:text-[var(--color-on-primary)]",
        disabled: "text-[var(--color-text-tertiary)] opacity-50",
        range_middle:
          "aria-selected:bg-[var(--color-accent-muted)] aria-selected:text-[var(--color-text-primary)]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeftIcon className="h-4 w-4" />,
        IconRight: () => <ChevronRightIcon className="h-4 w-4" />,
        Weekday,
        ...components,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
