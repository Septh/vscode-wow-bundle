
// Permet à TypeScript d'importer le html et le css
declare module '*.html'
declare module '*.css'

/**
 * VS Code
 */
// Copié/collé de \vscode\src\vs\workbench\services\themes\common\workbenchThemeService.ts
interface ITokenColorizationSetting {
    foreground?: string
    background?: string
    fontStyle?: string
}

interface ITokenColorizationRule {
    name?: string
    scope: string | string[]
    settings: ITokenColorizationSetting
}

interface ITokenColorCustomizations {
    // comments?: string | ITokenColorizationSetting
    // strings?: string | ITokenColorizationSetting
    // numbers?: string | ITokenColorizationSetting
    // keywords?: string | ITokenColorizationSetting
    // types?: string | ITokenColorizationSetting
    // functions?: string | ITokenColorizationSetting
    // variables?: string | ITokenColorizationSetting
    textMateRules?: ITokenColorizationRule[]
}

// Version simplifiée des thèmes de VS Code, avec seulement les champs qui nous intéressent
interface IThemeContribution {
    id?: string     // Certains vieux thèmes n'ont pas d'id
    label: string   // Mais tous ont un label
    uiTheme: 'vs' | 'vs-dark' | 'hc-black',
}

// Simplifie l'accès aux thèmes dans les réglages
type IVSCodeTokenColorCustomizationsSettings = Record<string, ITokenColorizationRule[] | ITokenColorCustomizations>

// mini-API de VS Code accessible depuis les webviews
interface IVSCodeWebviewApi {
    getState(): any
    setState(state: any): void
    postMessage(message: any): void
}
declare function acquireVsCodeApi(): IVSCodeWebviewApi

/**
 * Angular
 */

// Type de la fonction pour les bindings de type '&'
type ngComponentEventBinding = (param: Record<string, any>) => void
