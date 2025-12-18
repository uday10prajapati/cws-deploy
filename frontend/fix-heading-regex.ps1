$filepath = "d:\Job\CWS\car-wash\frontend\src\Customer\Bookings.jsx"

# Read the file
$content = [System.IO.File]::ReadAllText($filepath)

# Use regex replacement to update the heading
$pattern = '(<h2 className=")text-3xl font-bold( flex items-center gap-2">)\s*<FaCar className="text-blue-400" />'
$replacement = '$1text-4xl font-extrabold text-slate-900$2' + "`n              <div className=`"w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl`">" + "`n                <FaCar />" + "`n              </div>"

$content = [regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Update the paragraph
$pattern2 = '(<p className=")text-slate-400 text-sm mt-1(">\s*)Choose your car, services, and schedule\. We[''`"]ll confirm your slot\s+via SMS \/ WhatsApp\.'
$replacement2 = '$1text-slate-600 text-base$2Choose your car, services, and schedule. We''ll confirm your slot via SMS / WhatsApp.'

$content = [regex]::Replace($content, $pattern2, $replacement2, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Fix indentation of EXISTING BOOKINGS comment
$content = $content -replace '(\s+)\{/\* EXISTING BOOKINGS SECTION \*/\}', "`n        {/* EXISTING BOOKINGS SECTION */}"

# Write back
[System.IO.File]::WriteAllText($filepath, $content, [System.Text.Encoding]::UTF8)

Write-Host "Heading updated successfully!"
