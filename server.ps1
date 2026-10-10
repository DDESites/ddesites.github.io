$listener = New-Object System.Net.HttpListener
$root = 'C:\Users\Bruno\Desktop\nexo-sites'
$listener.Prefixes.Add('http://localhost:8761/')
$listener.Start()
Write-Host 'Servindo em http://localhost:8761/'

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.xml'  = 'application/xml; charset=utf-8'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = $ctx.Request.Url.LocalPath.TrimStart('/')
    if ($path -eq '' -or $path.EndsWith('/')) { $path = $path + 'index.html' }
    $file = Join-Path $root $path
    if ((Test-Path $file) -and (Get-Item $file).PSIsContainer -eq $false) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = $mime[$ext]
      if (-not $ctx.Response.ContentType) { $ctx.Response.ContentType = 'application/octet-stream' }
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $ctx.Response.StatusCode = 200
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    $ctx.Response.StatusCode = 500
  } finally {
    $ctx.Response.Close()
  }
}
