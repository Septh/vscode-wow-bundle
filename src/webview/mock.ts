/**
 * This file mocks the VSCode side of the extension.
 * Useful for testing and debugging the webview in a real browser as if it were a plain app:
 * - serve the built webview on http: `$ serve extension/webview/`
 * - view it in Chrome at `http://localhost:5000`
 * - debug/trace in VSCode using the `Attach to Chrome` launch config
 */

// tslint:disable object-literal-key-quotes align

import { IWebviewMessage, IWebviewMessageCommand,
         IExtensionMessageCommand, IExtensionMessageSettings, IExtensionMessageThemes, IExtensionMessageCurrentTheme
} from '../shared'

if (typeof acquireVsCodeApi === 'undefined') {
    console.warn('MOCKING!')

    const __vsCodeApi: IVSCodeWebviewApi = {
        getState() {},
        setState() {},
        postMessage(msg: any) {
            window.postMessage(msg, '*')
        }
    }
    ;(window as any).acquireVsCodeApi = () => __vsCodeApi

    const __msg_settings: IExtensionMessageSettings = {
        command: IExtensionMessageCommand.SETTINGS,
        settings: {
            '[Default Dark+]': {
                'textMateRules': [
                    { 'scope': 'comment.line.double-dash.wow.lua', 'settings': { 'fontStyle': 'bold italic' } },
                    { 'scope': 'comment.block.wow.lua',            'settings': { 'foreground': '#ffff00', 'fontStyle': 'italic' } }
                ]
            }
        }
    }

    const __msg_themes: IExtensionMessageThemes = {
        command: IExtensionMessageCommand.THEMES,
        themes: [
            { id: 'Default Dark+',  label: 'Dark+ (default dark)',   uiTheme: 'vs-dark' },
            { id: 'Default Light+', label: 'Light+ (default light)', uiTheme: 'vs'      },
            { id: 'Monokai',        label: 'Monokai',                uiTheme: 'vs-dark' },
        ]
    }

    const __msg_currentTheme: IExtensionMessageCurrentTheme = {
        command: IExtensionMessageCommand.CURRENT_THEME,
        currentTheme: __msg_themes.themes[0].label
    }

    window.addEventListener('message', (event: MessageEvent) => {
        const msg = event.data as IWebviewMessage
        if (msg.command === IWebviewMessageCommand.LOG) {
            console.log(msg.data)
        }
        else if (msg.command === IWebviewMessageCommand.READY) {
            // console.log('[MOCK] Reçoit "%s"', IWebviewMessageCommand.READY)

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.THEMES)
            __vsCodeApi.postMessage(__msg_themes)

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.CURRENT_THEME)
            __vsCodeApi.postMessage(__msg_currentTheme)

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.SETTINGS)
            __vsCodeApi.postMessage(__msg_settings)
        }
    }, false)
}
