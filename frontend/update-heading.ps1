param(
    [string]$FilePath
)

# Read all content
$lines = @(Get-Content $FilePath)
$totalLines = $lines.Count

# Process lines starting from 1106 (convert to 0-based: 1105)
$newLines = @()
$skipNextLine = $false

for ($i = 0; $i -lt $totalLines; $i++) {
    if ($skipNextLine) {
        $skipNextLine = $false
        continue
    }

    $line = $lines[$i]
    
    # Replace the heading section (lines 1105-1117)
    if ($i -eq 1104) {
        # Add fixed indentation heading
        $newLines += "        {/* Heading */}"
        $newLines += "        <div>"
        $newLines += '          <h2 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-2">'
        $newLines += '            <div className="w-12 h-12 rounded-lg bg-linear-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl">'
        $newLines += '              <FaCar />'
        $newLines += '            </div>'
        $newLines += '            Car Wash Booking'
        $newLines += '          </h2>'
        $newLines += '          <p className="text-slate-600 text-base">'
        $newLines += '            Choose your car, services, and schedule. We''ll confirm your slot via SMS / WhatsApp.'
        $newLines += '          </p>'
        $newLines += "        </div>"
        $newLines += ""
        $newLines += "        {/* EXISTING BOOKINGS SECTION */}"
        
        # Skip old heading content (lines 1105-1117)
        $i = 1116
    } else {
        $newLines += $line
    }
}

# Write the file
Set-Content -Path $FilePath -Value ($newLines -join "`n") -NoNewline

Write-Host "File updated successfully with new heading format!"
