
// Permet à TypeScript d'importer le html et le css
declare module '*.html'
declare module '*.css'

// mini-API de VS Code accessible depuis le webview
declare interface IVSCodeWebviewApi {
    getState(): any
    setState(state: any): void
    postMessage(message: any): void
}
declare function acquireVsCodeApi(): IVSCodeWebviewApi
