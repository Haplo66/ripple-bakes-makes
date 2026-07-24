Add-Type -AssemblyName System.Drawing

$productsRoot = "$PSScriptRoot\..\..\public\images\products"

$demoProducts = @(
  @{ id = 'BK-FP-001'; color1 = '#D6A54B'; color2 = '#C4953A'; label = 'Filled Pocket' }
  @{ id = 'BK-FB-001'; color1 = '#E8C87A'; color2 = '#B88A3A'; label = 'Flat Bread' }
  @{ id = 'SW-CS-001'; color1 = '#8FA88A'; color2 = '#6B8F65'; label = 'Custom Shirt' }
)

function New-DemoImage {
  param([string]$Path, [string]$Color1, [string]$Color2, [int]$Width = 800, [int]$Height = 800)

  $bmp = [System.Drawing.Bitmap]::new($Width, $Height)
  $gfx = [System.Drawing.Graphics]::FromImage($bmp)
  $gfx.SmoothingMode = 'HighQuality'

  $toColor = { param($hex) [System.Drawing.Color]::FromArgb(255,
      [Convert]::ToByte($hex.Substring(1,2),16),
      [Convert]::ToByte($hex.Substring(3,2),16),
      [Convert]::ToByte($hex.Substring(5,2),16)) }

  $c1 = & $toColor $Color1
  $c2 = & $toColor $Color2

  $brush1 = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0,0),
    [System.Drawing.Point]::new($Width,$Height),
    $c1, $c2
  )
  $gfx.FillRectangle($brush1, 0, 0, $Width, $Height)

  $lightBrush = [System.Drawing.SolidBrush]::new(
    [System.Drawing.Color]::FromArgb(30, 255, 255, 255)
  )
  $gfx.FillEllipse($lightBrush, -100, -100, 400, 400)
  $gfx.FillEllipse($lightBrush, $Width-250, $Height-250, 350, 350)

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $gfx.Dispose()
  $bmp.Dispose()
}

foreach ($p in $demoProducts) {
  $dir = Join-Path $productsRoot $p.id
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

  $img1 = Join-Path $dir '01.jpg'
  $img2 = Join-Path $dir '02.jpg'

  New-DemoImage -Path $img1 -Color1 $p.color1 -Color2 $p.color2
  New-DemoImage -Path $img2 -Color1 "#F5E6D3" -Color2 $p.color2

  Write-Host "✓ $($p.id) — 01.jpg, 02.jpg"
}

Write-Host "`nDemo images created."
