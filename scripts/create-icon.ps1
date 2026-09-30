$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$resourceDir = Join-Path $PSScriptRoot '..\build'
New-Item -ItemType Directory -Path $resourceDir -Force | Out-Null
$sizes = @(16, 24, 32, 48, 64, 128, 256)
$images = @()
foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($size / 256.0), ($size / 256.0))
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $shape = New-Object System.Drawing.Drawing2D.GraphicsPath
    $shape.AddArc(4, 4, 80, 80, 180, 90)
    $shape.AddArc(172, 4, 80, 80, 270, 90)
    $shape.AddArc(172, 172, 80, 80, 0, 90)
    $shape.AddArc(4, 172, 80, 80, 90, 90)
    $shape.CloseFigure()
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 133, 117))
    $graphics.FillPath($brush, $shape)
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 13)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $graphics.DrawEllipse($pen, 63, 78, 130, 130)
    $graphics.DrawLine($pen, 128, 143, 128, 110)
    $graphics.DrawLine($pen, 128, 143, 153, 128)
    $graphics.DrawLine($pen, 111, 48, 145, 48)
    $graphics.DrawLine($pen, 128, 48, 128, 61)
    $graphics.DrawLine($pen, 184, 72, 194, 62)
    $stream = New-Object System.IO.MemoryStream
    $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
    $images += ,$stream.ToArray()
    if ($size -eq 256) { $bitmap.Save((Join-Path $resourceDir 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png) }
    $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose(); $brush.Dispose(); $pen.Dispose(); $shape.Dispose()
}
$file = [System.IO.File]::Create((Join-Path $resourceDir 'icon.ico'))
$writer = New-Object System.IO.BinaryWriter($file)
$writer.Write([UInt16]0); $writer.Write([UInt16]1); $writer.Write([UInt16]$sizes.Length)
$offset = 6 + 16 * $sizes.Length
for ($i = 0; $i -lt $sizes.Length; $i++) {
    $dimension = if ($sizes[$i] -eq 256) { 0 } else { $sizes[$i] }
    $writer.Write([byte]$dimension); $writer.Write([byte]$dimension)
    $writer.Write([byte]0); $writer.Write([byte]0)
    $writer.Write([UInt16]1); $writer.Write([UInt16]32)
    $writer.Write([UInt32]$images[$i].Length); $writer.Write([UInt32]$offset)
    $offset += $images[$i].Length
}
foreach ($bytes in $images) { $writer.Write([byte[]]$bytes) }
$writer.Dispose(); $file.Dispose()
Copy-Item -LiteralPath (Join-Path $resourceDir 'icon.png') -Destination (Join-Path $PSScriptRoot '..\public\icon.png')
Write-Output 'Created multi-resolution Windows icon and app PNG.'
