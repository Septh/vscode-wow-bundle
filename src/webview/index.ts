/**
 * This file is responsible for bootstraping AngularJS
 */
import './mock'

import * as angular from 'angular'
import { RootModule } from './app'

import './index.html'
import './index.css'

const wowBundle = angular.module('wowbundle', [ RootModule.name ])

// AngularJS refuse de s'auto-initialiser parce qu'il ne connaît pas le protocole vscode-ressource:,
// donc on le bootstrape à la main.
angular.element(document).ready( () => {
    angular.bootstrap(document.getElementsByTagName('body')[0], [ wowBundle.name ], { strictDi: true })
})
