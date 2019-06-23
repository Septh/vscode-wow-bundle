
import * as angular from 'angular'
import { fromEvent, Observable } from 'rxjs'
import { map, filter, share, distinctUntilChanged, startWith } from 'rxjs/operators'
import {
    IExtensionMessage, IExtensionMessageCommand, IExtensionMessageSettings, IExtensionMessageThemes, IExtensionMessageCurrentTheme,
    IWebviewMessage, IWebviewMessageCommand
} from '../../../shared'

/*****************************************************************************
 * Interface du service
 *****************************************************************************/
export interface IExtensionService {
    readonly vscodeSettings$: Observable<IVSCodeTokenColorCustomizationsSettings>
    readonly vscodeThemes$: Observable<IThemeContribution[]>
    readonly vscodeCurrentTheme$: Observable<string>
    putRawSettings(settings: IVSCodeTokenColorCustomizationsSettings): void
    messageToHost(message: IWebviewMessage): void
}

/*****************************************************************************
 * Implémentation du service
 *****************************************************************************/
const initialSettings: IVSCodeTokenColorCustomizationsSettings = {}
const initialThemes: IThemeContribution[] = []
const initialCurrentTheme: string = ''

class ExtensionServiceImpl implements IExtensionService {

    // Permet de communiquer avec l'extension côté VS Code
    private vscode: IVSCodeWebviewApi = acquireVsCodeApi()

    // Les données reçues de l'extension côté VS Code
    public readonly vscodeSettings$: Observable<IVSCodeTokenColorCustomizationsSettings>
    public readonly vscodeThemes$: Observable<IThemeContribution[]>
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
 * Crée et exporte le module du service
 *****************************************************************************/
export const ExtensionService = angular.module('extension.service', [])
    .service('extension.service', ExtensionServiceImpl)
    .run([ 'extension.service', (ext: IExtensionService) => {
        // Quand l'app démarre, prévient l'extension VS Code qu'on est prêt
        ext.messageToHost({
            command: IWebviewMessageCommand.READY
        })
    }])
