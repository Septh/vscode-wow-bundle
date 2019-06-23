
import * as angular from 'angular'

import { RuleEditorController, RuleEditorControllerBindings } from './rule-editor'
import RuleEditorTemplate from './rule-editor.html'
import './rule-editor.css'

// Crée et exporte le module du composant
export const RuleEditor = angular.module('RuleEditor', [
    'ColorEditor',
    'FontstyleEditor'
]).component('wbRuleEditor', {
    bindings: RuleEditorControllerBindings,
    controller: RuleEditorController,
    template: RuleEditorTemplate
})
