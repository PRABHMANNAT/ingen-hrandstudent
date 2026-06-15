import React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ingen Student Platform",
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return children
}
