#! /c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell

# Parse test.lua in debug mode, writing output to test.txt
# Uses grammar-debug (https://github.com/maelvalais/grammar-debug), which must be installed globally
Set-Item -Path env:VSCODE_TEXTMATE_DEBUG -Value 1
grammar-debug $PSScriptRoot\grammar-debug\test.tmLanguage.json $PSScriptRoot\grammar-debug\test.lua > $PSScriptRoot\grammar-debug\test.txt
Remove-Item -Path env:VSCODE_TEXTMATE_DEBUG
