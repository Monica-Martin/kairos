import { LightningElement } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class DashboardTerapeuta extends NavigationMixin(LightningElement) {

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }
    /**
     * Navega al perfil detallado del paciente.
     * En el futuro, capturaremos el ID del registro desde el evento.
     */
    handleViewPatientProfile(event) {
        console.log('Navegando al perfil del paciente...');
        
        // Ejemplo de cómo sería la navegación real a un registro de Salesforce:
        /*
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: event.target.dataset.id, // Id del paciente
                objectApiName: 'Paciente__c',
                actionName: 'view'
            }
        });
        */
    }

    /**
     * Gestiona el clic en "Ver todos" para las alertas críticas.
     */
    handleViewAllAlerts(event) {
        event.preventDefault();
        console.log('Cargando el listado completo de alertas tempranas...');
        
        // Aquí podrías redirigir a una pestaña específica de reportes
    }
}