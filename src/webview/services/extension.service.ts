
import * as angular from 'angular'
import * as Utils from '../utils'
import { fromEvent, Observable } from 'rxjs'
import { map, filter, share, distinctUntilChanged, startWith } from 'rxjs/operators'
import {
    IVSCodeTokenColorCustomizationsSettings, IVSCodeThemeContribution,
    IExtensionMessage, IExtensionMessageCommand, IExtensionMessageSettings, IExtensionMessageThemes, IExtensionMessageCurrentTheme,
    IWebviewMessage, IWebviewMessageCommand
} from '../../shared'

export interface IExtensionService {
    readonly vscodeSettings$: Observable<IVSCodeTokenColorCustomizationsSettings>
    readonly vscodeThemes$: Observable<IVSCodeThemeContribution[]>
    readonly vscodeCurrentTheme$: Observable<string>
    putRawSettings(settings: IVSCodeTokenColorCustomizationsSettings): void
    messageToHost(message: IWebviewMessage): void
}

/*****************************************************************************
 * Implémentation du service
 *****************************************************************************/

// Valeurs initiales des réglages
const initialSettings: IVSCodeTokenColorCustomizationsSettings = {}
const initialThemes: IVSCodeThemeContribution[] = []
const initialCurrentTheme: string = ''

class ExtensionServiceImpl implements IExtensionService {

    // Permet de communiquer avec l'extension côté VS Code
    private vscode: IVSCodeWebviewApi = acquireVsCodeApi()

    // Les données reçues de l'extension côté VS Code
    public readonly vscodeSettings$: Observable<IVSCodeTokenColorCustomizationsSettings>
    public readonly vscodeThemes$: Observable<IVSCodeThemeContribution[]>
    public readonly vscodeCurrentTheme$: Observable<string>

    public static readonly $inject = [ '$window' ]
    constructor(private $window: ng.IWindowService) {

        // Crée les observables
        const message$ = fromEvent<MessageEvent>(this.$window, 'message').pipe(
            map(evt => evt.data as IExtensionMessage),
            share()
        )

        this.vscodeSettings$ = message$.pipe(
            filter(msg => msg.command === IExtensionMessageCommand.SETTINGS),
            map(msg => (msg as IExtensionMessageSettings).settings),
            distinctUntilChanged(angular.equals),   // Evite de se reprendre nos propres modifs dans la gueule
            startWith(initialSettings),
        )

        this.vscodeThemes$ = message$.pipe(
            filter(msg => msg.command === IExtensionMessageCommand.THEMES),
            map(msg => (msg as IExtensionMessageThemes).themes),
            startWith(initialThemes)
        )

        this.vscodeCurrentTheme$ = message$.pipe(
            filter(msg => msg.command === IExtensionMessageCommand.CURRENT_THEME),
            map(msg => (msg as IExtensionMessageCurrentTheme).currentTheme),
            startWith(initialCurrentTheme)
        )
    }

    // Envoie un message à l'extension
    public messageToHost(message: IWebviewMessage) {
        this.vscode.postMessage(message)
    }

    // Renvoie les réglages à l'extension
    public putRawSettings(settings: IVSCodeTokenColorCustomizationsSettings) {
        this.messageToHost({
            command: IWebviewMessageCommand.SETTINGS_UPDATED,
            settings
        })
    }
}

/*****************************************************************************
 * Exporte le registrar pour ce service
 *****************************************************************************/
export const ExtensionService: Utils.NGRegistrar = {
    register: (parent: ng.IModule) => {

        // Crée le service
        parent.service('extension.service', ExtensionServiceImpl)

        // Quand l'app démarre, prévient l'extension VS Code qu'on est prêt
        parent.run(['extension.service', (ext: IExtensionService) => {
            ext.messageToHost({
                command: IWebviewMessageCommand.READY
            })
        }])

        return parent
    }
}
