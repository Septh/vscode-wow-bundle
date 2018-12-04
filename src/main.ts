
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
    vscode.languages.setTextDocumentLanguage(document, 'wow-lua')
}


// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    console.info('wowbundle activé')

    // Initialise le panel
    panel.init(context)

    // Surveille les nouveaux documents et transforme ceux déjà ouverts
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(wowify))
    for (const document of vscode.workspace.textDocuments) {
        wowify(document)
    }

    // Enregistre les commandes
    context.subscriptions.push(vscode.commands.registerCommand('wowbundle.showSettings', panel.show))
    context.subscriptions.push(vscode.commands.registerCommand('wowbundle.hideSettings', panel.hide))
}

export function deactivate() {
}
