# Read the file
$content = Get-Content "d:\Job\CWS\car-wash\frontend\src\Customer\Bookings.jsx" -Raw

# Find the heading section and replace it
# Using a different approach - find and replace specific lines
$lines = $content -split "`n"
$newLines = @()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    # Check if this is the heading section
    if ($line -match 'text-3xl font-bold flex items-center gap-2') {
        # Replace the heading
        $newLines += '          <h2 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-2">'
        $i++ # Skip next line
        # Add the gradient icon container
        $newLines += '            <div className="w-12 h-12 rounded-lg bg-linear-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl">'
        $newLines += '              <FaCar />'
        $newLines += '            </div>'
    } elseif ($line -match 'text-slate-400 text-sm mt-1') {
        # Replace the description paragraph
        $newLines += '          <p className="text-slate-600 text-base">'
        $i++
        # Skip old content lines and add new one
        while ($i -lt $lines.Count -and $lines[$i] -notmatch '</p>') {
            $i++
        }
        $newLines += '            Choose your car, services, and schedule. We''ll confirm your slot via SMS / WhatsApp.'
    } else {
        $newLines += $line
    }
}

$newContent = $newLines -join "`n"
Set-Content "d:\Job\CWS\car-wash\frontend\src\Customer\Bookings.jsx" -Value $newContent -NoNewline

Write-Host "File updated!"
