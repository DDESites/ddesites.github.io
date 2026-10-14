# Servidor local simples para a Bella Boutique
# Uso: powershell -ExecutionPolicy Bypass -File .\server.ps1  (porta 8000)

$porta = 8000
$pasta = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$porta/")
$listener.Start()

Write-Host "Bella Boutique rodando em http://localhost:$porta (Ctrl+C para parar)"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".jpg"  = "image/jpeg"
  ".png"  = "image/png"
  ".webp" = "image/webp"
  ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $caminho = [System.Uri]::UnescapeDataString($context.Request.Url.AbsolutePath)
  if ($caminho -eq "/") { $caminho = "/index.html" }
  $arquivo = Join-Path $pasta $caminho.TrimStart("/").Replace("/", "\")

  if (Test-Path $arquivo -PathType Leaf) {
    $extensao = [System.IO.Path]::GetExtension($arquivo).ToLower()
    $bytes = [System.IO.File]::ReadAllBytes($arquivo)
    $context.Response.ContentType = $mime[$extensao]
    $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $context.Response.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 - pagina nao encontrada</h1>")
    $context.Response.ContentType = "text/html; charset=utf-8"
    $context.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $context.Response.Close()
}
