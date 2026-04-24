const fs = require('fs')

const possibleFiles = [
  'frontend/src/App.jsx',
  'frontend/src/App.js'
]

function findAppFile() {
  for (let file of possibleFiles) {
    if (fs.existsSync(file)) {
      return file
    }
  }
  return null
}

const appFile = findAppFile()

if (!appFile) {
  console.log("App file not found (App.js or App.jsx)")
  process.exit(0) // don't fail
}

const checks = [
  { keyword: 'name', label: 'Name input field' },
  { keyword: 'hours', label: 'Hours missing field' },
  { keyword: 'transport', label: 'Transport input' },
  { keyword: 'submit', label: 'Submit button' },
  { keyword: 'confidence', label: 'Confidence display' },
  { keyword: 'reason', label: 'AI reasoning text' },
  { keyword: 'category', label: 'Predicted category' },
  { keyword: 'map', label: 'Map / location reference' },
  { keyword: 'google', label: 'Google Maps link' },
  { keyword: 'movement', label: 'Movement signal' },
  { keyword: 'cognitive', label: 'Cognitive signal' },
  { keyword: 'device', label: 'Device anchor signal' },
  { keyword: 'button', label: 'Button elements' },
  { keyword: 'form', label: 'Form structure' }
]

let missing = []

console.log("PHANTOM UI Progress Check\n")

const content = fs.readFileSync(appFile, 'utf-8').toLowerCase()

checks.forEach(check => {
  if (!content.includes(check.keyword)) {
    console.log(`Missing: ${check.label}`)
    missing.push(check.label)
  } else {
    console.log(`${check.label} found`)
  }
})

console.log("\n----------------------------------")

if (missing.length > 0) {
  console.log("UI is PARTIALLY COMPLETE")
  console.log("\nMissing components:")
  missing.forEach(item => console.log(`- ${item}`))
} else {
  console.log("UI is FULLY COMPLETE")
}
