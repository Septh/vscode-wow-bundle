// tslint:disable

import { IWebviewMessage, IWebviewMessageCommand,
         IExtensionMessageCommand, IExtensionMessageSettings, IExtensionMessageThemes, IExtensionMessageCurrentTheme
} from '../shared'

if (typeof acquireVsCodeApi === 'undefined') {
    console.warn('MOCKING!')

    const $$mock_settings: IVSCodeTokenColorCustomizationsSettings = {
        "[Default Dark+]": {
            "textMateRules": [
                {
                    "scope": "comment.block.wow.lua",
                    "settings": {
                        "foreground": "#ffff00",
                        "fontStyle": "italic"
                    }
                },
                {
                    "scope": "comment.line.double-dash.wow.lua",
                    "settings": {
                        "fontStyle": "bold italic"
                    }
                }
            ]
        }
    }

    const $$mock_themes: IThemeContribution[] = [
        { id: 'Default Dark+',  label: 'Dark+ (default dark)',   uiTheme: 'vs-dark' },
        { id: 'Default Light+', label: 'Light+ (default light)', uiTheme: 'vs'      },
        { id: 'Monokai',        label: 'Monokai',                uiTheme: 'vs-dark' },
    ]

    const $$noop = () => {}
    const $$vsCodeApi: IVSCodeWebviewApi = {
        getState: () => $$noop,
        setState: () => $$noop,
        postMessage: (msg: any) => {
            window.postMessage(msg, '*')
        }
    };
    (window as any).acquireVsCodeApi = () => $$vsCodeApi

    window.addEventListener('message', (event: MessageEvent) => {
        const msg = event.data as IWebviewMessage
        if (msg.command === IWebviewMessageCommand.LOG) {
            console.log(msg)
        }
        else if (msg.command === IWebviewMessageCommand.READY) {
            // console.log('[MOCK] Reçoit "%s"', IWebviewMessageCommand.READY)

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.THEMES)
            $$vsCodeApi.postMessage(<IExtensionMessageThemes>{ command: IExtensionMessageCommand.THEMES, themes: $$mock_themes })

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.CURRENT_THEME)
            $$vsCodeApi.postMessage(<IExtensionMessageCurrentTheme>{ command: IExtensionMessageCommand.CURRENT_THEME, currentTheme: $$mock_themes[0].label })

            // console.log('[MOCK] Envoie "%s"', IExtensionMessageCommand.SETTINGS)
            $$vsCodeApi.postMessage(<IExtensionMessageSettings>{ command: IExtensionMessageCommand.SETTINGS, settings: $$mock_settings })
        }
    }, false)
}
