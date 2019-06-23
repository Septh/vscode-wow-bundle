
import * as angular from 'angular'
import { SettingsService } from './services'
import { RuleEditor } from './components'

import { AppController } from './app'
import AppTemplate from './app.html'
import './app.css'

// Crée et exporte l'app
export const AppModule = angular.module('App', [
    'ngSanitize', 'ngAnimate',
    SettingsService.name,
    RuleEditor.name
])
.component('wbApp', {
    controller: AppController,
    template: AppTemplate
})
