import * as LucideIcons from "lucide-react";
import { SVGProps } from "react";
export type IconName = "home" | "bar-chart" | "file-text" | "image" | "heart" | "layout-grid" | "message-square" | "help-circle" | "megaphone" | "mail" | "minus" | "target" | "wallet" | "layers" | "log-out" | "globe" | "settings" | "eye" | "eye-off" | "monitor" | "smartphone" | "undo" | "redo" | "copy" | "trash" | "grip" | "arrow-left" | "arrow-right" | "check" | "x" | "chevron-up" | "chevron-down" | "plus" | "hand-heart" | "shield-check" | "droplet" | "book-open" | "utensils" | "cross" | "send" | "tablet" | "search" | "arrow-up" | "arrow-down" | "phone" | "message-circle" | "facebook" | "twitter" | "instagram" | "youtube" | "linkedin" | "map-pin" | "tiktok" | "check-circle" | (string & {});
const SPECIAL_MAPPINGS: Record<string, keyof typeof LucideIcons> = {
    "bar-chart": "BarChart3",
    x: "X",
    cross: "Plus",
    tiktok: "Video",
};
function toPascalCase(str: string): string {
    return str
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join("");
}
export default function Icon({ name, size = 20, className, strokeWidth = 2, ...props }: {
    name: IconName;
    size?: number;
    strokeWidth?: number;
} & SVGProps<SVGSVGElement>) {
    const mappedName = SPECIAL_MAPPINGS[name];
    const pascalName = mappedName || (toPascalCase(name) as keyof typeof LucideIcons);
    const IconComponent = LucideIcons[pascalName] as React.ComponentType<any>;
    if (!IconComponent) {
        const Fallback = LucideIcons.HelpCircle;
        return <Fallback size={size} className={className} strokeWidth={strokeWidth} {...(props as any)}/>;
    }
    return <IconComponent size={size} className={className} strokeWidth={strokeWidth} {...(props as any)}/>;
}
