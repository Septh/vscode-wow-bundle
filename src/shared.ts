
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
    themes: IThemeContribution[]
}
