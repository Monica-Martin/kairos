import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class DashboardFamiliar extends LightningElement {

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }

    handleManualReward() {
        console.log('Botón SOS: Premio Manual presionado. Preparando lógica para sumar puntos extras.');
    }

    handleManualPenalty() {
        console.log('Botón SOS: Castigo Manual presionado. Preparando lógica para aplicar penalización.');
    }

    handleViewAllHistory(event) {
        event.preventDefault();
        console.log('Clic en Ver todo el historial. Futura navegación a página de detalle.');
    }
}