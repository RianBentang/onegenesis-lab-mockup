# Refresh the vendored ONE-Genesis theme from onegenesis-web's last production build.
# Reads onegenesis-web only. Run `npm run build` in onegenesis-web first if styles changed.
#
#   powershell -ExecutionPolicy Bypass -File sync-theme.ps1
param(
    [string]$Web = 'C:\Users\Bentang\Projects\work\ONE-Genesis\onegenesis-web'
)
$ErrorActionPreference = 'Stop'
$Dest = $PSScriptRoot
$Dist = Join-Path $Web 'dist\assets'

$css = Get-ChildItem $Dist -Filter 'index-*.css' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $css) { throw "No index-*.css in $Dist. Run 'npm run build' in onegenesis-web first." }
$text = [IO.File]::ReadAllText($css.FullName)

# Fonts / images the bundle references as /assets/<file>
$refs = [regex]::Matches($text, 'url\(/assets/([^)?#"]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
foreach ($f in $refs) { Copy-Item (Join-Path $Dist $f) $Dest -Force }

# Make paths relative (works from file://) and drop template demo images that don't exist.
$text = $text.Replace('url(/assets/', 'url(./')
$text = [regex]::Replace($text, 'url\("?\./assets/images/[^)]*\)', 'none')
[IO.File]::WriteAllText((Join-Path $Dest 'onegenesis.css'), $text)

$brand = Join-Path $Dest 'brand'
New-Item -ItemType Directory -Force $brand | Out-Null
foreach ($f in 'desktop-logo.png', 'desktop-dark.png', 'toggle-logo.png', 'toggle-dark.png', 'favicon.ico') {
    Copy-Item (Join-Path $Web "src\assets\images\brand-logos\$f") $brand -Force
}

Write-Host "Synced $($css.Name) + $($refs.Count) assets into $Dest"
