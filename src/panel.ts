
import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { WebviewMessage, WebviewMessageCommand, VSCodeThemes, VSCodeSettings } from './shared'

/*
 * Gestion du panneau
 */
class SettingsUIPanel {

    private panel: vscode.WebviewPanel
    private disposables: vscode.Disposable[] = []

    // Constructeur
    constructor(private context: vscode.ExtensionContext) {}

    // Collecte les données à éditer
    private collectThemes() {

        const themes: VSCodeThemes = []

        for (const extension of vscode.extensions.all) {
            const manifest = extension.packageJSON || {}
            if (manifest.contributes && manifest.contributes.themes) {
                for (const theme of manifest.contributes.themes) {
                    themes.push(theme)
                }
            }
        }

        return themes
    }

    private collectCurrentTheme() {
        return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme')
    }

    private collectSettings() {
        return vscode.workspace.getConfiguration('editor').get<VSCodeSettings>('tokenColorCustomizations')
    }

    // Envoie un message au webview
    private messageToWebview(msg: WebviewMessage) {
        if (this.panel) {
            this.panel.webview.postMessage(msg)
        }
    }

    // Traite les messages reçus du webview
    private onWebviewMessage(msg: WebviewMessage) {

        switch(msg.command) {
            case WebviewMessageCommand.CMD_WEBVIEW_LOG:
                console.info('[webview log]', ...msg.data)
                break

            case WebviewMessageCommand.CMD_WEBVIEW_READY:
                // Le webview est prêt, on répond avec les thèmes et les réglages
                this.messageToWebview({
                    command: WebviewMessageCommand.CMD_EXTENSION_THEMES,
                    themes: this.collectThemes(),
                })
                this.messageToWebview({
                    command: WebviewMessageCommand.CMD_EXTENSION_CURRENT_THEME,
                    currentTheme: this.collectCurrentTheme(),
                })
                this.messageToWebview({
                    command: WebviewMessageCommand.CMD_EXTENSION_SETTINGS,
                    settings: this.collectSettings()
                })
                break

            case WebviewMessageCommand.CMD_WEBVIEW_UPDATE_SETTINGS:
                vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', msg.settings, true)
                break
        }
    }

    // Réagit aux changements des réglages pendant que le webview est ouvert ET visible
    private onSettingsChanged(evt: vscode.ConfigurationChangeEvent) {

        if (evt.affectsConfiguration('workbench.colorTheme')) {
            this.messageToWebview({
                command: WebviewMessageCommand.CMD_EXTENSION_CURRENT_THEME,
                currentTheme: this.collectCurrentTheme()
            })
        }

        if (evt.affectsConfiguration('editor.tokenColorCustomizations')) {
            this.messageToWebview({
                command: WebviewMessageCommand.CMD_EXTENSION_SETTINGS,
                settings: this.collectSettings()
            })
        }
    }

    private onDispose() {
        let disposable
        while (disposable = this.disposables.pop()) {
            disposable.dispose()
        }
        this.panel = undefined
    }

    // Affiche le panneau des options
    public show() {
        if (this.panel) {
            this.panel.reveal()
        }
        else {
            // 1. Charge le HTML et ajuste le tag <base>
            const webviewUri = vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview'))
            let html
            try {
                html = fs.readFileSync(path.join(webviewUri.fsPath, 'index.html'), 'utf8')
                         .replace(/<base href="(.*?)">/ui, `<base href="${webviewUri.with({ scheme: 'vscode-resource' }).toString(true)}/">`)
            }
            catch(e) {
                // TODO: Afficher un message d'erreur plus parlant...
                vscode.window.showErrorMessage(e.message)

                html = `
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <title>WoW Bundle Token Colors Editor</title>
                    </head>
                    <body>
                        <h1 style="color: red;">Error loading the settings editor.</h1>
                    </body>
                    </html>`
            }

            // 2. Crée le webview
            const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.One
            this.panel = vscode.window.createWebviewPanel('wow-bundle.webview', 'WoW Bundle Settings Editor', column, {
                enableScripts: true,
                // enableCommandUris: false,
                localResourceRoots: [ webviewUri ],    // Limite le webview à son répertoire
                // retainContextWhenHidden: true
            })

            // 3. Ecoute les événements qui nous intéressent
            this.panel.onDidDispose(this.onDispose, this, this.disposables)
            this.panel.webview.onDidReceiveMessage(this.onWebviewMessage, this, this.disposables)
            vscode.workspace.onDidChangeConfiguration(this.onSettingsChanged, this, this.disposables)

            // 4. Affiche le html
            this.panel.webview.html = html
        }
    }

    // Ferme le panneau
    public hide() {
        if (this.panel) {
            this.panel.dispose()
            this.panel = undefined
        }
    }
}


// Affiche le paneau des options
let settingsPanel: SettingsUIPanel

export function init(context: vscode.ExtensionContext) {
    settingsPanel = new SettingsUIPanel(context)
}

export function show() {
    settingsPanel.show()
}

export function hide() {
    settingsPanel.hide()
}
