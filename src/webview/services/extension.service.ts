
import * as angular from 'angular'
import * as Utils from '../utils'
import { WebviewMessage, WebviewMessageCommand, VSCodeSettings, VSCodeThemes } from '../../shared'
import { fromEvent, Observable } from 'rxjs'
import { map, filter, share, distinctUntilChanged, startWith } from 'rxjs/operators'

export interface IExtensionService {
    readonly vscodeSettings$: Observable<VSCodeSettings>
    readonly vscodeThemes$: Observable<VSCodeThemes>
    readonly vscodeCurrentTheme$: Observable<string>
    putRawSettings(settings: VSCodeSettings): void
    messageToHost(message: WebviewMessage): void
}

export const wbExtensionService: Utils.NGRegistrable = {
    register: (parent: ng.IModule) => {

        // Crée le service
        parent.service('extension.service', ExtensionService)

        // Quand l'app démarre, prévient l'extension VS Code qu'on est prêt
        parent.run( [ 'extension.service', (ext: IExtensionService) => {
            ext.messageToHost( {
                command: WebviewMessageCommand.CMD_WEBVIEW_READY
            })
        }])

        return parent
    }
}

/*****************************************************************************
 * Implémentation du service
 *****************************************************************************/

// mini-API de VS Code accessible depuis le webview
declare var acquireVsCodeApi: () => WebviewApi
interface WebviewApi {
    getState(): any
    setState(state: any): void
    postMessage(message: WebviewMessage): void
}

// Valeurs initiales des réglages
const initialSettings: VSCodeSettings = {}
const initialThemes: VSCodeThemes = []
const initialCurrentTheme: string = ''

class ExtensionService implements IExtensionService {

    // Permet de communiquer avec l'extension côté VS Code
    private vscode: WebviewApi = acquireVsCodeApi()

    // Les données reçues de l'extension côté VS Code
    vscodeSettings$: Observable<VSCodeSettings>
    vscodeThemes$: Observable<VSCodeThemes>
    vscodeCurrentTheme$: Observable<string>

    static readonly $inject = [ '$window' ]
    constructor(private $window: ng.IWindowService) {

        // Crée les observables
        const message$ = fromEvent<MessageEvent>(this.$window, 'message').pipe(
            map(evt => evt.data as WebviewMessage),
            share()
        )

        this.vscodeSettings$ = message$.pipe(
            filter(msg => msg.command === WebviewMessageCommand.CMD_EXTENSION_SETTINGS),
            map(msg => msg.settings),
            distinctUntilChanged(angular.equals),   // Evite de se reprendre nos propres modifs dans la gueule
            startWith(initialSettings),
        )

        this.vscodeThemes$ = message$.pipe(
            filter(msg => msg.command === WebviewMessageCommand.CMD_EXTENSION_THEMES),
            map(msg => msg.themes),
            startWith(initialThemes)
        )

        this.vscodeCurrentTheme$ = message$.pipe(
            filter(msg => msg.command === WebviewMessageCommand.CMD_EXTENSION_CURRENT_THEME),
            map(msg => msg.currentTheme),
            startWith(initialCurrentTheme)
        )
    }

    // Envoie un message à l'extension
    messageToHost(message: WebviewMessage) {
        this.vscode.postMessage(message)
    }

    // Renvoie les réglages à l'extension
    putRawSettings(settings: VSCodeSettings) {
        this.messageToHost({
            command: WebviewMessageCommand.CMD_WEBVIEW_UPDATE_SETTINGS,
            settings
        })
    }
}
