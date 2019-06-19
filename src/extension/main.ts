
import * as vscode from 'vscode'
import * as panel from './panel'

const foldersOnly = true

// Change le langage d'un doc lua en wow-lua
async function wowify(document: vscode.TextDocument) {
    if (document.languageId !== 'lua') {
        return
    }

    if (foldersOnly) {
        const folder = vscode.workspace.getWorkspaceFolder(document.uri)
        if (!folder) {
            return
        }

        const tocUris = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, `${folder.name}.toc`))
        if (tocUris.length !== 1) {
            return
        }
    }

    console.log(document.fileName)
    // vscode.languages.setTextDocumentLanguage(document, 'wow-lua')
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

    // Initialise le panel
    panel.init(context)

    // Enregistre les commandes et surveille les nouveaux documents
    context.subscriptions.push(
        vscode.commands.registerCommand('wowbundle.showSettings', panel.show),
        vscode.commands.registerCommand('wowbundle.hideSettings', panel.hide),
        vscode.workspace.onDidOpenTextDocument(wowify)
    )

    // Transforme les documents déjà ouverts
    for (const document of vscode.workspace.textDocuments) {
        wowify(document)
    }
}

export function deactivate() {
}
