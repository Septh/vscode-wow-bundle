
import * as Utils from '../utils'

export const wbFontStyleEditorComponent: Utils.NGRegistrable = {
    register: (parent: ng.IModule) => parent.component('wbFontstyleEditor', FontStyleEditorComponentOptions)
}

/*****************************************************************************
 * Implémentation du composant
 *****************************************************************************/

// Styles supportés
type TStyleName = 'bold' | 'italic' | 'underline'
type TFontStyles = {
    [ style in TStyleName ]: boolean
}

const BOLD_REGEX = /\bbold\b/i
const ITALIC_REGEX = /\bitalic\b/i
const UNDERLINE_REGEX = /\bunderline\b/i

// Contrôleur du composant
class FontStyleEditorController implements ng.IController {

    // Bindinds
    style: string
    disabled: boolean
    onUpdate: Utils.ExpressionBinding

    // Autres
    styles: TFontStyles = {
        bold: false,
        italic: false,
        underline: false
    }

    // Met à jour notre modèle quand celui du parent change
    $onChanges(changes: ng.IOnChangesObject) {
        if (changes.disabled) {
            this.disabled = changes.disabled.currentValue
        }
        if (changes.style) {
            this.style = changes.style.currentValue

            this.styles.bold = BOLD_REGEX.test(this.style)
            this.styles.italic = ITALIC_REGEX.test(this.style)
            this.styles.underline = UNDERLINE_REGEX.test(this.style)
        }
    }

    // Met à jour notre modèle quand celui des enfants change
    styleChanged() {
        this.style = Object.keys(this.styles).filter( k => this.styles[k as TStyleName] ).join(' ')
        this.notifyParent()
    }

    // Met à jour le modèle parent quand le nôtre a changé
    notifyParent() {
        this.onUpdate({ fontStyle: this.style })
    }
}

const FontStyleEditorComponentOptions: ng.IComponentOptions = {
    bindings: {
        style: '<fontstyle',
        disabled: '<ngDisabled',
        onUpdate: '&'
    },
    controller: FontStyleEditorController,
    templateUrl: './assets/fontstyle-editor.component.html'
}
