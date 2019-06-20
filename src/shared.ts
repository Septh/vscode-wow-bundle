
/**
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

// Simplifie l'accès aux thèmes dans les réglages
export type IVSCodeTokenColorCustomizationsSettings = Record<string, ITokenColorizationRule[] | ITokenColorCustomizations>

/*
 * Format des thèmes dans VSCode
 * (version simplifiée, avec seulement les champs qui nous intéressent)
 */
export interface IVSCodeThemeContribution {
    id?: string     // Certains vieux thèmes n'ont pas d'id
    label: string   // Mais tous ont un label
    uiTheme: 'vs' | 'vs-dark' | 'hc-black',
}

/**
 * Format des messages envoyés par le webview à l'extension
 */
export type IWebviewMessage = IWebviewMessageLog | IWebviewMessageReady | IWebviewMessageUpdateSettings

export const enum IWebviewMessageCommand {
    LOG = 'webview-log',
    READY = 'webview-ready',
    SETTINGS_UPDATED = 'webview-settings-updated'
}

export interface IWebviewMessageLog {
    command: IWebviewMessageCommand.LOG
    data: any
}

export interface IWebviewMessageReady {
    command: IWebviewMessageCommand.READY
}

export interface IWebviewMessageUpdateSettings {
    command: IWebviewMessageCommand.SETTINGS_UPDATED
    settings: IVSCodeTokenColorCustomizationsSettings
}

/**
 * Format des messages envoyés par l'extension au webview
 */
export type IExtensionMessage = IExtensionMessageSettings | IExtensionMessageThemes | IExtensionMessageCurrentTheme

export const enum IExtensionMessageCommand {
    CURRENT_THEME = 'extension-current-theme',
    THEMES = 'extension-themes',
    SETTINGS = 'extension-settings'
}

export interface IExtensionMessageCurrentTheme {
    command: IExtensionMessageCommand.CURRENT_THEME
    currentTheme: string
}

export interface IExtensionMessageSettings {
    command: IExtensionMessageCommand.SETTINGS
    settings: IVSCodeTokenColorCustomizationsSettings
}

export interface IExtensionMessageThemes {
    command: IExtensionMessageCommand.THEMES
    themes: IVSCodeThemeContribution[]
}
