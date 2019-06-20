
import * as Utils from '../../utils'
import { ComponentEventBinding } from '../bindings';

import template from './color-editor.component.html'

/*****************************************************************************
 * Implémentation du composant
 *****************************************************************************/
class ColorEditorController implements ng.IController {

    // Bindinds
    public color!: string
    public disabled!: boolean
    public onUpdate!: ComponentEventBinding

    // Utilisés par le template
    public colorModelPattern: RegExp = Utils.HEX_COLOR_REGEX
    public colorModelOptions: ng.INgModelOptions = {
        // updateOn: 'default',
        // debounce: { default: 500 },
        allowInvalid: true
    }

    get cssSafeColor() {
        let color = this.color || ''
        if (color === '') {
            color = 'transparent'
        }
        else if (color.length === 9) {
            const rgba = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})([\da-f]{2})$/ui.exec(color)
            color = rgba ? `rgba(${parseInt(rgba[1], 16)}, ${parseInt(rgba[2], 16)}, ${parseInt(rgba[3], 16)}, ${parseInt(rgba[4], 16) / 255})` : 'transparent'
        }
        return color
    }

    get isPickerShown() {
        return false
    }

    // Constructeur
    public static readonly $inject = [ '$element' ]
    constructor(private $element: JQLite) {}

    // Ajuste la largeur des boutons à la hauteur de l'input pour obtenir des boutons carrés
    public $postLink() {
        const input = this.$element.find('input')
        const inputStyle = getComputedStyle(input[0])

        // On ne peut pas lire directement la hauteur de l'input, car si le composant est caché
        // (par exemple dans un <details> fermé), sa hauteur vaut 'auto'. D'où l'addition des propriétés
        // et le passage par calc() pour éviter d'interpréter nous-mêmes les unités css.
        // NB: l'input DOIT avoir ses propriétés initialisées à des valeurs numériques (pas de mot-clé genre 'inherit'),
        //     ce qui est fait dans le css de ce composant.
        const inputHeight = [ 'line-height', 'border-bottom-width', 'border-top-width', 'padding-bottom', 'padding-top' ]
            .map( prop => inputStyle.getPropertyValue(prop) )
            .join(' + ')
        this.$element.find('button').css('width', `calc(${inputHeight})`)
    }

    // Met à jour notre modèle quand celui du parent change
    public $onChanges(changes: ng.IOnChangesObject) {
        if (changes.disabled) {
            this.disabled = changes.disabled.currentValue
        }
        if (changes.color) {
            this.color = changes.color.currentValue
        }
    }

    // Met à jour notre modèle quand celui des enfants a changé
    public clear() {
        this.color = ''
        this.colorChanged()
    }

    public colorChanged()
    {
        this.notifyParent()
    }

    // Met à jour le modèle parent quand le nôtre a changé, mais seulement s'il est valide
    public notifyParent() {
        this.onUpdate({ color: this.color })
    }
}

/*****************************************************************************
 * Exporte le registrar pour ce composant
 *****************************************************************************/
const ColorEditorComponentOptions: ng.IComponentOptions = {
    bindings: {
        color: '<',
        disabled: '<ngDisabled',
        onUpdate: '&'
    },
    controller: ColorEditorController,
    template
}

export const ColorEditorComponent: Utils.NGRegistrar = {
    register: (parent: ng.IModule) => parent.component('wbColorEditor', ColorEditorComponentOptions)
}
