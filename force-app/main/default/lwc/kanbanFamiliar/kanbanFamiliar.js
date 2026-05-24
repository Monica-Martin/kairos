import { LightningElement, track } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import myResource from '@salesforce/resourceUrl/toSR';
import getPacienteData from '@salesforce/apex/TiendaRecompensasCtrl.getPacienteData';
import registrarMovimientoPuntos from '@salesforce/apex/tareasCtrl.registrarMovimientoPuntos';

export default class KanbanFamiliar extends LightningElement {

    pacienteData = null;

    isPuntosModalOpen = false;

    puntosModalTipo = 'Suma';
    
    puntosMotivo = '';

    puntosCantidad = '';

    get puntosModalTitulo() {
        return this.puntosModalTipo === 'Suma' ? 'Añadir Nueva Recompensa (+)' : 'Aplicar Nuevo Castigo (-)';
    }

    get isPuntosGuardarDisabled() {
        return !this.puntosMotivo || !this.puntosCantidad || this.puntosCantidad <= 0;
    }

    get mostrarBotonRecompensas() {
        return this.pacienteData ? this.pacienteData.PermisoCreacionRecompensas__c : false;
    }

    get mostrarBotonCastigos() {
        return this.pacienteData ? this.pacienteData.PermisoCreacionCastigos__c : false;
    }

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
        this.loadData();
    }

    loadData() {
        this.loadPacienteData();
    }

    async loadPacienteData() {
        try {
            const data = await getPacienteData();
            if (data) {
                this.pacienteData = data;
            } else {
                this.showToast('Atención', 'No se encontró ningún paciente vinculado a su cuenta familiar.', 'warning');
            }
        } catch (error) {
            console.error('Error al cargar datos del paciente:', error);
            this.showToast('Error', 'Hubo un problema al obtener la información del panel.', 'error');
        }
    }

    handleOpenRewardModal() {
        this.puntosModalTipo = 'Suma';
        this.isPuntosModalOpen = true;
    }

    handleOpenPunishModal() {
        this.puntosModalTipo = 'Resta';
        this.isPuntosModalOpen = true;
    }

    handlePuntosFormChange(event) {
        const field = event.target.name;
        if (field === 'puntosMotivo') this.puntosMotivo = event.target.value;
        if (field === 'puntosCantidad') this.puntosCantidad = event.target.value;
    }

    async guardarMovimientoPuntos() {
        try {
            await registrarMovimientoPuntos({
                motivo: this.puntosMotivo,
                puntos: parseInt(this.puntosCantidad, 10),
                tipo: this.puntosModalTipo
            });

            const mensaje = this.puntosModalTipo === 'Suma' 
                ? `¡Puntos añadidos con éxito por: ${this.puntosMotivo}!` 
                : `Puntos restados por: ${this.puntosMotivo}`;

            this.showToast('¡Hecho!', mensaje, 'success');
            
            this.closePuntosModal();

            setTimeout(() => {
                this.refreshPanelData(); 
            }, 100);

        } catch (error) {
            console.error('Error al guardar movimiento de puntos:', error);
            this.showToast('Error', 'No se pudo registrar el movimiento de puntos.', 'error');
        }
    }

    closePuntosModal() {
        this.isPuntosModalOpen = false;
        this.puntosMotivo = '';
        this.puntosCantidad = '';
    }

    refreshPanelData() {
        this.loadData();
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}