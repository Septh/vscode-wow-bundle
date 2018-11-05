try {
    Remove-Item -Path env:VSCODE_TEXTMATE_DEBUG -ErrorAction stop
}
catch {
}
finally {
    Set-Item -Path env:VSCODE_TEXTMATE_DEBUG -Value 1
    grammar-debug .\languages\grammars\wow-lua.tmLanguage.json .\debug.lua > .\debug.txt
}
