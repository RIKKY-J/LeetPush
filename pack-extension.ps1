param(
    [string]$SourceDir = "extension",
    [string]$OutputFile = "leetpush-extension.zip"
)

$srcPath = (Resolve-Path $SourceDir).Path
$outPath = [System.IO.Path]::GetFullPath($OutputFile)

if (Test-Path $outPath) {
    Remove-Item -Force $outPath
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($outPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $srcPath -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($srcPath.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
}

$zip.Dispose()
Write-Host "Successfully packaged $OutputFile with forward-slash paths!"
