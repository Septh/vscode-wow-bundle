
/*
 * Formats des réglages tels que reçus de VSCode
 * Copié/collé de \vscode\src\vs\workbench\services\themes\common\workbenchThemeService.ts
 */
export interface ITokenColorizationSetting {
    foreground?: string
    background?: string
    fontStyle?: string
}

export interface ITokenColorizationRule {
    name?: string
    scope: string | string[]
    settings: ITokenColorizationSetting
}

// Version simplifiée, avec seulement les champs qui nous intéressent
export interface ITokenColorCustomizations {
    // comments?: string | ITokenColorizationSetting
    // strings?: string | ITokenColorizationSetting
    // numbers?: string | ITokenColorizationSetting
    // keywords?: string | ITokenColorizationSetting
    // types?: string | ITokenColorizationSetting
    // functions?: string | ITokenColorizationSetting
    // variables?: string | ITokenColorizationSetting
    textMateRules?: ITokenColorizationRule[]
}

/*
 * Format des thèmes dans VSCode
 */
// Version simplifiée, avec seulement les champs qui nous intéressent
export interface IVSCodeTheme {
    id?: string     // Certains vieux thèmes n'ont pas d'id
    label: string   // Mais tous ont un label
    uiTheme: 'vs' | 'vs-dark' | 'hc-black',
    // path?: string
}

export const DefaultTheme: IVSCodeTheme = {
    id: 'Default Dark+',
    label: 'Dark+ (default dark)',
    uiTheme: 'vs-dark'
}

// Simplifie l'accès aux thèmes dans les réglages
export interface VSCodeSettings extends ITokenColorCustomizations {
    [themeName: string]: ITokenColorizationRule[] | ITokenColorCustomizations | undefined
}

/*
 * Communication extension <-> webview
 */

// Format des messages échangés entre l'extension et le webview
export const enum WebviewMessageCommand {
    // webview -> extension
    CMD_WEBVIEW_LOG = 'webview-log',
    CMD_WEBVIEW_READY = 'webview-ready',
    CMD_WEBVIEW_UPDATE_SETTINGS = 'webview-update-settings',

    // extension -> webview
    CMD_EXTENSION_SETTINGS = 'extension-settings',
    CMD_EXTENSION_THEMES = 'extension-themes',
    CMD_EXTENSION_CURRENT_THEME = 'extension-current-theme'
}

export interface WebviewMessage {
    command: WebviewMessageCommand
    themes?: IVSCodeTheme[]
    currentTheme?: string
    settings?: VSCodeSettings
    data?: any
}
