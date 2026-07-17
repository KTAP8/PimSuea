import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  if (!print_methods?.length) return null
  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
        {print_methods
          .filter(m => m.name.toUpperCase() !== 'DTF')
          .map(m => {
          const meta = PRINT_META[m.name.toUpperCase()]
          return (
            <Tooltip key={m.id}>
              <TooltipTrigger asChild>
                <Badge
                  className={
                    meta?.className ??
                    "border-transparent bg-gray-100 text-gray-700 cursor-default"
                  }
                >
                  {m.name.toUpperCase()}
                </Badge>
              </TooltipTrigger>
              {meta && (
                <TooltipContent side="top">
                  <p>{meta.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
