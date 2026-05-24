import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';

export default class InfoPaciente extends LightningElement {
    
    @api paciente;

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
    }

    get edadFormateada() {
        if (this.paciente && this.paciente.Edad__c) {
            return `${this.paciente.Edad__c} Años`;
        }
        return 'Edad N/D';
    }

    get puntosFormateados() {
        if (this.paciente && this.paciente.PuntosTotales__c != null) {
            return this.paciente.PuntosTotales__c.toLocaleString('es-ES');
        }
        return '0';
    }
}