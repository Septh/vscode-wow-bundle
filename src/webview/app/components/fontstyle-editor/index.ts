
import * as angular from 'angular'

import { FontstyleEditorController, FontstyleEditorControllerBindings } from './fontstyle-editor'
import FontstyleEditorTemplate from './fontstyle-editor.html'
import './fontstyle-editor.css'

// Crée et exporte le module du composant
export const FontstyleEditor = angular.module('FontstyleEditor', [])
    .component('wbFontstyleEditor', {
        bindings: FontstyleEditorControllerBindings,
        controller: FontstyleEditorController,
        template: FontstyleEditorTemplate
    })
