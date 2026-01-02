# Read the file
$content = Get-Content "d:\Job\CWS\car-wash\frontend\src\Customer\Bookings.jsx" -Raw

# Replace the heading section (fix indentation and styling)
$oldHeading = '      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-6">
          {/* Heading */}
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <FaCar className="text-blue-400" />
              Car Wash Booking
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Choose your car, services, and schedule. We''ll confirm your slot
              via SMS / WhatsApp.
            </p>
          </div>'

$newHeading = '      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-6">
        {/* Heading */}
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-linear-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center text-2xl">
              <FaCar />
            </div>
            Car Wash Booking
          </h2>
          <p className="text-slate-600 text-base">
            Choose your car, services, and schedule. We''ll confirm your slot via SMS / WhatsApp.
          </p>
        </div>'

$content = $content -replace [regex]::Escape($oldHeading), $newHeading

# Fix indentation for EXISTING BOOKINGS SECTION comment
$content = $content -replace '          \{/\* EXISTING BOOKINGS SECTION \*/\}', '        {/* EXISTING BOOKINGS SECTION */}'

# Save the file
Set-Content "d:\Job\CWS\car-wash\frontend\src\Customer\Bookings.jsx" -Value $content -NoNewline

Write-Host "File updated successfully!"
