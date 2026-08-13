import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { filterActivePrintMethods, getPrintMethodShortLabel } from "@/constants/printing"

const PRINT_META: Record<string, { description: string; className: string }> = {
  DTG: {
    description: "พิมพ์ลงผ้าโดยตรง — เหมาะสำหรับเสื้อสีขาว ดีไซน์ละเอียด",
    className: "border-transparent bg-purple-100 text-purple-800 hover:bg-purple-100 cursor-default",
  },
}

interface Props {
  print_methods?: { id: string; name: string }[]
  className?: string
}

export function PrintMethodBadges({ print_methods, className }: Props) {
  const activeMethods = filterActivePrintMethods(print_methods)
  if (!activeMethods.length) return null
  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1 min-w-0 ${className ?? ""}`}>
        {activeMethods.map(m => {
          const metaKey = m.name.toUpperCase().includes('DTG') ? 'DTG' : m.name.toUpperCase()
          const meta = PRINT_META[metaKey]
          const shortLabel = getPrintMethodShortLabel(m.name)
          const fullLabel = m.name.toUpperCase()
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <Badge
                  className={
                    (meta?.className ??
                    "border-transparent bg-gray-100 text-gray-700 cursor-default") +
                    " max-w-full text-[10px] sm:text-xs px-1.5 sm:px-2"
                  }
                >
                  <span className="sm:hidden">{shortLabel}</span>
                  <span className="hidden sm:inline truncate">{fullLabel}</span>
                </Badge>
              </TooltipTrigger>
              {meta && (
                <TooltipContent side="top">
                  <p>{fullLabel} — {meta.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
