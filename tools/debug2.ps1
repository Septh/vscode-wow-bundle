# Parse debug.lua in debug mode, writing output to debug.txt
# Uses grammar-debug (https://github.com/maelvalais/grammar-debug), which must be installed globally
Set-Item -Path env:VSCODE_TEXTMATE_DEBUG -Value 1
grammar-debug "E:\Microsoft VS Code\resources\app\extensions\javascript\syntaxes\JavaScript.tmLanguage.json" $PSScriptRoot\debug.js > $PSScriptRoot\debug2.txt
Remove-Item -Path env:VSCODE_TEXTMATE_DEBUG
