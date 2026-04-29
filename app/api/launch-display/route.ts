import { exec, execSync } from "child_process"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"

const KIOSK_PROFILE = "C:\\adease-kiosk-display"

// Common Chrome installation paths on Windows
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
]

function findChrome(): string | null {
  for (const p of CHROME_PATHS) {
    if (p && fs.existsSync(p)) return p
  }
  // Last resort: check if "chrome" is in PATH
  try {
    const result = execSync("where chrome", { encoding: "utf8" }).trim()
    if (result) return result.split("\n")[0].trim()
  } catch {}
  return null
}

function killExistingKiosk(): Promise<void> {
  return new Promise((resolve) => {
    const cmd = `powershell -Command "Get-WmiObject Win32_Process -Filter \\"CommandLine LIKE '%%adease-kiosk-display%%'\\" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`
    exec(cmd, { shell: "cmd.exe" }, () => resolve())
  })
}

export async function POST(req: NextRequest) {
  const { url, x, y, width, height } = await req.json()

  const chromePath = findChrome()
  if (!chromePath) {
    console.error("Chrome not found on this machine")
    return NextResponse.json({ success: false, error: "Chrome not found" }, { status: 500 })
  }

  // Always kill existing kiosk before opening new one
  await killExistingKiosk()
  await new Promise((r) => setTimeout(r, 600))

  const args = [
    "--new-window",
    "--kiosk",
    `--user-data-dir=${KIOSK_PROFILE}`,
    `--window-position=${x},${y}`,
    `--window-size=${width},${height}`,
    url,
  ].join(" ")

  const cmd = `"${chromePath}" ${args}`

  exec(cmd, { shell: "cmd.exe" }, (err) => {
    if (err) console.error("Failed to launch kiosk:", err.message)
  })

  return NextResponse.json({ success: true, chrome: chromePath })
}
