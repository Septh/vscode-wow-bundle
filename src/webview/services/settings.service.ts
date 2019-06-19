
import * as angular from 'angular'
import * as Utils from '../utils'
import { IExtensionService } from './extension.service'
import { IEditableSettings, IEditableRule, EThemeNames, IEditableTheme } from '../settings'
import { VSCodeSettings, IVSCodeTheme, ITokenColorizationRule } from '../../shared'
import { Observable } from 'rxjs'
import { startWith, map, tap } from 'rxjs/operators'

export interface ISettingsService {
    readonly editorSettings$: Observable<IEditableSettings>
    readonly installedThemes$: Observable<IEditableTheme[]>
    readonly currentTheme$: Observable<string>
    putRule(bracketedThemeName: string, ruleToMerge: IEditableRule): void

    // Dev/debug
    getRawSettings(): VSCodeSettings
}

export const wbSettingsService: Utils.NGRegistrable = {
    register: (parent: ng.IModule) => parent.service('settings.service', SettingsService)
}

/*****************************************************************************
 * Implémentation du service
 *****************************************************************************/
const initialSettings: IEditableSettings = {}
const initialThemes: IEditableTheme[] = []
const initialCurrentTheme: string = ''

class SettingsService implements ISettingsService {

    public readonly editorSettings$: Observable<IEditableSettings>
    public readonly installedThemes$: Observable<IEditableTheme[]>
    public readonly currentTheme$: Observable<string>

    // Pour getRawSettings()
    private rawSettings!: VSCodeSettings

    // Constructeur
    public static readonly $inject = [ 'extension.service' ]
    constructor(private ExtensionService: IExtensionService) {

        // Transforme les réglages bruts en provenance de l'extension
        this.editorSettings$ = this.ExtensionService.vscodeSettings$.pipe(
            tap( vscodeSettings => this.rawSettings = vscodeSettings),
            map( vscodeSettings => this.normalizeSettings(vscodeSettings) ),
            startWith(initialSettings)
        )

        this.installedThemes$ = this.ExtensionService.vscodeThemes$.pipe(
            map( vscodeThemes => this.normalizeThemes(vscodeThemes) ),
            startWith(initialThemes)
        )

        this.currentTheme$ = this.ExtensionService.vscodeCurrentTheme$.pipe(
            map( vscodeCurrentTheme => this.normalizeCurrentTheme(vscodeCurrentTheme) ),
            startWith(initialCurrentTheme)
        )
    }

    // Transforme les réglages bruts de VSCode en quelque chose de plus facile à gérer :
    // - Ajoute un nom de "thème" [global] pour les réglages généraux
    // - Ne prend en compte que les textMateRules[]
    // - Une règle = un scope
    // TODO: Filtrer les règles des autres langages, qui ne nous concernent pas
    private normalizeRules(rawRules: ITokenColorizationRule[]): IEditableRule[] {

        const editableRules: IEditableRule[] = []

        for (const rawRule of rawRules) {
            if (Array.isArray(rawRule.scope)) {
                for (const scope of rawRule.scope) {
                    editableRules.push(angular.merge({}, rawRule, { scope }) as IEditableRule)
                }
            }
            else {
                editableRules.push(angular.copy(rawRule) as IEditableRule)
            }
        }

        return editableRules
    }

    private normalizeSettings(vscodeSettings: VSCodeSettings): IEditableSettings {

        // Normalise les nouvelles règles
        const editableSettings: IEditableSettings = {}

        for (const [ key, value ] of Object.entries(vscodeSettings)) {
            if (key === 'textMateRules') {
                editableSettings[EThemeNames.GLOBAL] = this.normalizeRules(value as ITokenColorizationRule[] || [])
            }
            else if (EThemeNames.isBracketed(key)) {
                editableSettings[key] = this.normalizeRules((value as VSCodeSettings).textMateRules || [])
            }
        }

        // Transmet les règles normalisées au contrôleur
        return editableSettings
    }

    // Transforme la liste des thèmes installés :
    // - S'assure que tous les thèmes ont un label ET un id
    // Ne se produit qu'une fois, à l'ouverture du webview
    // (puisque la liste des thèmes ne peut pas changer sans redémarrer VS Code)
    private normalizeThemes(vscodeThemes: IVSCodeTheme[]): IEditableTheme[] {

        // Transmet les thèmes normalisés au contrôleur
        const installedThemes = vscodeThemes.map(rawTheme => {
            return {
                id:    rawTheme.id || rawTheme.label,
                label: rawTheme.label,
                type:  rawTheme.uiTheme
            }
        })
        return installedThemes
    }

    // Transforme le nom du thème courant
    private normalizeCurrentTheme(vscodeCurrentTheme: string): string {
        return vscodeCurrentTheme
    }

    // Dénormalise une règle
    private denormalizeRule(editableRule: IEditableRule): ITokenColorizationRule | null {

        let denormalized: ITokenColorizationRule | null = null

        if (editableRule.flags) {
            if ((editableRule.flags.setForeground && Utils.isColor(editableRule.settings.foreground)) ||
                (editableRule.flags.setBackground && Utils.isColor(editableRule.settings.background)) ||
                 editableRule.flags.setFontStyle) {

                denormalized = {
                    scope: editableRule.scope,
                    settings: {}
                }

                if (editableRule.name) {
                    denormalized.name = editableRule.name
                }

                if (editableRule.flags.setForeground) {
                    denormalized.settings.foreground = editableRule.settings.foreground
                }

                if (editableRule.flags.setBackground) {
                    denormalized.settings.background = editableRule.settings.background
                }

                if (editableRule.flags.setFontStyle) {
                    denormalized.settings.fontStyle = editableRule.settings.fontStyle
                }
            }
        }

        return denormalized
    }

    // Réintroduit une règle dans les réglages bruts
    public putRule(bracketedThemeName: string, ruleToMerge: IEditableRule) {

        // S'assure qu'il existe une entrée pour ce thème
        let themeSettings: VSCodeSettings
        if (bracketedThemeName === EThemeNames.GLOBAL) {
            themeSettings = this.rawSettings
        }
        else {
            if (!Utils.isObject(this.rawSettings[bracketedThemeName])) {
                this.rawSettings[bracketedThemeName] = {}
            }
            themeSettings = this.rawSettings[bracketedThemeName] as VSCodeSettings
        }

        if (!Array.isArray(themeSettings.textMateRules)) {
            themeSettings.textMateRules = []
        }

        // Supprime du thème toute référence au scope de cette règle
        const themeRules = themeSettings.textMateRules
        for (let i = themeRules.length - 1; i >= 0; i--) {      // https://www.incredible-web.com/blog/performance-of-for-loops-with-javascript/
            const themeRule = themeRules[i]
            if (Array.isArray(themeRule.scope)) {
                let idx = themeRule.scope.indexOf(ruleToMerge.scope)
                while (idx >= 0) {
                    themeRule.scope.splice(idx, 1)
                    idx = themeRule.scope.indexOf(ruleToMerge.scope)
                }
                if (themeRule.scope.length === 0) {
                    themeRules.splice(i, 1)
                }
            }
            else if (themeRule.scope === ruleToMerge.scope) {
                themeRules.splice(i, 1)
            }
        }

        // Dénormalise et ajoute la règle si elle n'est pas vide
        const rawRule = this.denormalizeRule(ruleToMerge)
        if (rawRule) {
            themeRules.push(rawRule)
        }
        else {
            // Sinon, nettoie les places vides
            if (themeSettings.textMateRules.length === 0) {
                delete themeSettings.textMateRules
            }
            if (bracketedThemeName !== EThemeNames.GLOBAL && Object.keys(this.rawSettings[bracketedThemeName] as any).length === 0) {
                delete this.rawSettings[bracketedThemeName]
            }
        }

        // Envoie les nouveaux réglages bruts à VS Code
        this.ExtensionService.putRawSettings(this.rawSettings)
    }

    // Dev/debug
    public getRawSettings() {
        return this.rawSettings
    }
}
