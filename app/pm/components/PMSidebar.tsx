"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { IngenLogo } from "@/components/ingen-logo"
import { useAppTheme } from "@/components/theme/ThemeProvider"
import { themeClasses } from "@/lib/theme"
import {
    Brain,
    LayoutDashboard,
    Users,
    Settings,
    Search,
    Sun,
    Moon,
    FileText,
} from "lucide-react"



export default function PMSidebar() {
    const pathname = usePathname()
    const { theme, toggleTheme } = useAppTheme()
    const [isExpanded, setIsExpanded] = useState(false)
    const [mounted, setMounted] = useState(false)
    const isDark = mounted ? theme === "dark" : false
    const t = themeClasses[theme]
    const themeLabel = isDark ? "Switch to light mode" : "Switch to dark mode"
    const ThemeIcon = isDark ? Sun : Moon

    useEffect(() => {
        setMounted(true)
    }, [])

    const navItems = [
        { label: "Candidates", icon: LayoutDashboard, href: "/", exact: true },
        { label: "Job Brief", icon: FileText, href: "/job-brief" },
        { label: "Analyse Profile", icon: Users, href: "/analyse-profile" },
        { label: "Interviews", icon: Users, href: "/interviews" },
    ]

    return (
        <div
            className={cn(
                "flex flex-col py-4 bg-[#f8f3ea] border border-[#ded2c2] shrink-0 z-50 transition-all duration-300 ease-out group/sidebar m-4 h-fit my-auto rounded-[2.5rem] shadow-2xl relative gap-2 dark:bg-[#121212] dark:border-white/10",
                `${t.sidebar} backdrop-blur-xl`,
                isExpanded ? "w-64 px-4 items-start" : "w-[68px] items-center"
            )}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* Logo area */}
            <div className={cn("flex items-center px-0 w-full", isExpanded ? "justify-start px-2 gap-3" : "justify-center")}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 hover:bg-[#241f18]/5 dark:hover:bg-black/5 dark:hover:bg-white/5">
                    <IngenLogo size={32} className="w-8 h-8 rounded-lg" />
                </div>
                <div className={cn(
                    "flex flex-col overflow-hidden transition-all duration-300",
                    isExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                )}>
                    <span className="text-sm font-bold text-[#241f18] tracking-wide whitespace-nowrap dark:text-white">iNGEN</span>
                    <span className="text-[10px] text-[#241f18]/45 font-medium tracking-wider uppercase whitespace-nowrap dark:text-white/40">Hiring Platform</span>
                </div>
            </div>

            {/* Nav Items */}
            <div className="flex-1 flex flex-col gap-2 w-full items-center justify-center">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href)

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "h-10 flex items-center transition-all duration-200 relative group w-full",
                                isExpanded ? "justify-start px-3" : "justify-center"
                            )}
                        >
                            {/* Active Indicator (Left Bar) */}
                            {isActive && (
                                <div className={cn(
                                    "absolute left-0 w-1 h-6 bg-[#FF6B00] rounded-r-full shadow-[0_0_12px_rgba(255,107,0,0.6)] transition-all duration-300",
                                    isExpanded ? "-left-4" : "left-0"
                                )} />
                            )}

                            {/* Icon Wrapper */}
                            <div className={cn(
                                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                                isActive ? "text-[#DF5F12]" : "text-[#241f18]/45 group-hover:text-[#241f18] group-hover:bg-[#241f18]/5 dark:group-hover:bg-black/5 dark:text-white/40 dark:group-hover:text-white dark:group-hover:bg-white/5"
                            )}>
                                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {/* Label (Expanded) */}
                            <span className={cn(
                                "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3",
                                isExpanded ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-4 absolute",
                                isActive ? "text-[#241f18] dark:text-white" : "text-[#241f18]/60 group-hover:text-[#241f18] dark:text-white/60 dark:group-hover:text-white"
                            )}>
                                {item.label}
                            </span>

                            {/* Tooltip on Hover (Collapsed Only) */}
                            {!isExpanded && (
                                <div className="absolute left-16 px-3 py-1.5 bg-[#fffaf2] border border-[#ded2c2] rounded-lg text-xs font-medium text-[#241f18] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] shadow-xl dark:bg-[#1A1A1A] dark:border-white/10 dark:text-white">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </div>

            {/* Bottom Actions */}
            <div className={cn("mt-auto flex flex-col gap-2 w-full", isExpanded ? "px-2" : "px-0 items-center")}>
                <Link
                    href="/settings"
                    className={cn(
                    "h-10 flex items-center transition-all duration-200 relative group w-full",
                    isExpanded ? "justify-start px-2" : "justify-center",
                    pathname.startsWith("/settings") && "text-[#DF5F12]"
                )}>
                    {pathname.startsWith("/settings") && (
                        <div className={cn(
                            "absolute left-0 w-1 h-6 bg-[#FF6B00] rounded-r-full shadow-[0_0_12px_rgba(255,107,0,0.6)] transition-all duration-300",
                            isExpanded ? "-left-4" : "left-0"
                        )} />
                    )}
                    <div className={cn(
                        "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                        pathname.startsWith("/settings")
                            ? "text-[#DF5F12]"
                            : "text-[#241f18]/45 group-hover:text-[#241f18] group-hover:bg-[#241f18]/5 dark:group-hover:bg-black/5 dark:text-white/40 dark:group-hover:text-white dark:group-hover:bg-white/5"
                    )}>
                        <Settings className="w-5 h-5" />
                    </div>
                    <span className={cn(
                        "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3",
                        pathname.startsWith("/settings") ? "text-[#241f18] dark:text-white" : "text-[#241f18]/60 group-hover:text-[#241f18] dark:text-white/60 dark:group-hover:text-white",
                        isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 absolute"
                    )}>
                        Settings
                    </span>
                    {!isExpanded && (
                        <div className="absolute left-16 px-3 py-1.5 bg-[#fffaf2] border border-[#ded2c2] rounded-lg text-xs font-medium text-[#241f18] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] shadow-xl dark:bg-[#1A1A1A] dark:border-white/10 dark:text-white">
                            Settings
                        </div>
                    )}
                </Link>

                <button
                    type="button"
                    aria-label={themeLabel}
                    title={themeLabel}
                    onClick={toggleTheme}
                    className={cn(
                        "h-10 flex items-center transition-all duration-200 relative group w-full",
                        isExpanded ? "justify-start px-2" : "justify-center"
                    )}
                >
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl text-[#241f18]/45 group-hover:text-[#241f18] group-hover:bg-[#241f18]/5 dark:group-hover:bg-black/5 transition-all dark:text-white/40 dark:group-hover:text-white dark:group-hover:bg-white/5">
                        <ThemeIcon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className={cn(
                        "text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ml-3 text-[#241f18]/60 group-hover:text-[#241f18] dark:text-white/60 dark:group-hover:text-white",
                        isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 absolute"
                    )}>
                        {isDark ? "Light mode" : "Dark mode"}
                    </span>
                    {!isExpanded && (
                        <div className="absolute left-16 px-3 py-1.5 bg-[#fffaf2] border border-[#ded2c2] rounded-lg text-xs font-medium text-[#241f18] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60] shadow-xl dark:bg-[#1A1A1A] dark:border-white/10 dark:text-white">
                            {themeLabel}
                        </div>
                    )}
                </button>

                <div className={cn(
                    "flex items-center rounded-xl transition-all duration-300",
                    isExpanded ? "bg-[#241f18]/5 dark:bg-black/5 pr-4 p-1 gap-3 dark:bg-white/5" : "p-0 justify-center w-10 h-10"
                )}>
                    <div className="w-8 h-8 rounded-full ring-2 ring-[#241f18]/10 dark:ring-white/10 shrink-0 overflow-hidden bg-[#241f18]">
                        <img
                            src="https://api.dicebear.com/9.x/notionists/svg?seed=Adhiraj%20Dogra"
                            alt="Adhiraj"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className={cn(
                        "flex flex-col overflow-hidden transition-all duration-300",
                        isExpanded ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"
                    )}>
                        <span className="text-xs font-semibold text-[#241f18] whitespace-nowrap dark:text-white">Adhiraj</span>
                        <span className="text-[10px] text-[#241f18]/45 whitespace-nowrap dark:text-white/40">PM</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
