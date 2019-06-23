
import { readFileSync } from 'fs'
import { join } from 'path'
import * as vscode from 'vscode'
import {
    IWebviewMessage, IWebviewMessageCommand,
    IExtensionMessage, IExtensionMessageCommand
} from '../shared'

class SettingsEditor {

    private panel: vscode.WebviewPanel | undefined
    private disposables: vscode.Disposable[] = []

    // Constructeur
    constructor(private context: vscode.ExtensionContext) {}

    // Collecte les données à éditer
    private collectInstalledThemes(): IThemeContribution[] {

        const themes: IThemeContribution[] = []

        for (const extension of vscode.extensions.all) {
            const pkg = extension.packageJSON || {}
            if (pkg.contributes && pkg.contributes.themes) {
                for (const theme of pkg.contributes.themes) {
                    themes.push(theme)
                }
            }
        }

        return themes
    }

    private collectCurrentTheme(): string {
        return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme')!
    }

    private collectCurrentSettings(): IVSCodeTokenColorCustomizationsSettings {
        return vscode.workspace.getConfiguration('editor').get<IVSCodeTokenColorCustomizationsSettings>('tokenColorCustomizations', {})
    }

    // Envoie un message au webview
    private messageToWebview(msg: IExtensionMessage) {
        if (this.panel) {
            this.panel.webview.postMessage(msg)
        }
    }

    // Traite les messages reçus du webview
    private onWebviewMessage(msg: IWebviewMessage) {

        switch (msg.command) {
            case IWebviewMessageCommand.LOG:
                console.info('[webview log]', ...msg.data)
                break

            case IWebviewMessageCommand.READY:
                // Le webview est prêt, on répond avec les thèmes et les réglages
                this.messageToWebview({
                    command: IExtensionMessageCommand.THEMES,
                    themes: this.collectInstalledThemes()
                })
                this.messageToWebview({
                    command: IExtensionMessageCommand.CURRENT_THEME,
                    currentTheme: this.collectCurrentTheme(),
                })
                this.messageToWebview({
                    command: IExtensionMessageCommand.SETTINGS,
                    settings: this.collectCurrentSettings()
                })
                break

            case IWebviewMessageCommand.SETTINGS_UPDATED:
                vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations', msg.settings, true)
                break
        }
    }

    // Réagit aux changements des réglages pendant que le webview est ouvert ET visible
    private onConfigChanged(evt: vscode.ConfigurationChangeEvent) {

        if (evt.affectsConfiguration('workbench.colorTheme')) {
            this.messageToWebview({
                command: IExtensionMessageCommand.CURRENT_THEME,
                currentTheme: this.collectCurrentTheme()
            })
        }

        if (evt.affectsConfiguration('editor.tokenColorCustomizations')) {
            this.messageToWebview({
                command: IExtensionMessageCommand.SETTINGS,
                settings: this.collectCurrentSettings() || {}
            })
        }
    }

    // Dispose everything that was allocated
    private onDispose() {
        let disposable: vscode.Disposable | undefined
        while (disposable = this.disposables.pop()) {
            disposable.dispose()
        }
        this.panel = undefined
    }

    // Show or reveal the panel
    public show() {
        if (this.panel) {
            this.panel.reveal()
        }
        else {
            // 1. Charge le HTML et ajuste le tag <base>
            const webviewUri = vscode.Uri.file(join(this.context.extensionPath, 'extension', 'webview'))
            let html
            try {
                html = readFileSync(join(webviewUri.fsPath, 'index.html'), 'utf8')
                       .replace(/<base href="(.*?)">/ui, `<base href="${webviewUri.with({ scheme: 'vscode-resource' }).toString(true)}/">`)
            }
            catch(e) {
                vscode.window.showErrorMessage(e.message)

                html = /* html */ `
                    <!doctype html>
                    <html lang="en">
                    <head>
                        <meta charset="utf-8">
                        <meta http-equiv="Content-Security-Policy" content="default-src 'none';">
                        <title>WoW Bundle Token Colors Editor</title>
                    </head>
                    <body>
                        <h1 style="color: red;">Error loading the settings editor.</h1>
                        <h2 style="color: red;">${e.message}</h2>
                    </body>
                    </html>`
            }

            // 2. Crée le webview
            this.panel = vscode.window.createWebviewPanel('wow-bundle-settings-editor', 'WoW Bundle Settings Editor', vscode.ViewColumn.Active, {
                enableScripts: true,
                // enableCommandUris: false,
                localResourceRoots: [ webviewUri ],     // Limite le webview à son répertoire
                // localResourceRoots: [vscode.Uri.file('D:\\Dev\\vscode\\wow-bundle').with({ scheme: 'vscode-resource' }) ],
                retainContextWhenHidden: true           // TODO: à virer
            })

            // 3. Ecoute les événements qui nous intéressent
            this.disposables.push(
                this.panel.onDidDispose(this.onDispose, this),
                this.panel.webview.onDidReceiveMessage(this.onWebviewMessage, this),
                vscode.workspace.onDidChangeConfiguration(this.onConfigChanged, this)
            )

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

let settingsEditor: SettingsEditor

export function init(context: vscode.ExtensionContext) {
    settingsEditor = new SettingsEditor(context)
}

export function show() {
    settingsEditor.show()
}

export function hide() {
    settingsEditor.hide()
}
