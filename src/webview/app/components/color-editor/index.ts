
import * as angular from 'angular'

import { ColorEditorController, ColorEditorControllerBindings, validateColorDirective } from './color-editor'
import ColorEditorTemplate from './color-editor.html'
import './color-editor.css'

// Crée et exporte le module du composant
export const ColorEditor = angular.module('ColorEditor', [])
    .component('wbColorEditor', {
        bindings: ColorEditorControllerBindings,
        controller: ColorEditorController,
        template: ColorEditorTemplate
    })
    .directive('validateColor', validateColorDirective)
