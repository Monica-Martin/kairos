import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getPacienteData from '@salesforce/apex/TiendaRecompensasCtrl.getPacienteData';
import aplicarCanjeoManual from '@salesforce/apex/TiendaRecompensasCtrl.aplicarCanjeoManual';
import getRecompensasTienda from '@salesforce/apex/TiendaRecompensasCtrl.getRecompensasTienda';
import LightningConfirm from 'lightning/confirm';

export default class TiendaRecompensas extends LightningElement {


    puntosTotales = 0;

    isModalOpen = false;

    puntosCanjeo = null;

    motivoCanjeo = '';

    recompensas = [];

    get puntosTotalesFormateados() {
        return this.puntosTotales.toLocaleString('es-ES');
    }


    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
        this.loadData();
    }

    loadData(){
        this.cargarSaldo();
        this.cargarCatalogo();
    }

    async cargarSaldo() {
        try {
            const paciente = await getPacienteData();
            if (paciente) {
                this.puntosTotales = paciente.PuntosTotales__c || 0;
            }
        } catch (error) {
            console.error('Error al cargar saldo:', error);
            this.showToast('Error', 'No se pudo cargar el saldo de puntos', 'error');
        }
    }

    openModal() {
        this.puntosCanjeo = null;
        this.motivoCanjeo = '';
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleInputChange(event) {
        const campo = event.target.dataset.field;
        if (campo === 'puntos') {
            this.puntosCanjeo = parseInt(event.target.value, 10);
        } else if (campo === 'motivo') {
            this.motivoCanjeo = event.target.value;
        }
    }

    async ejecutarCanjeo() {
        if (!this.puntosCanjeo || this.puntosCanjeo <= 0) {
            this.showToast('Atención', 'Debes introducir una cantidad válida de puntos a canjear.', 'warning');
            return;
        }

        if (this.puntosCanjeo > this.puntosTotales) {
            this.showToast('Saldo Insuficiente', 'No hay suficientes puntos para este canjeo.', 'error');
            return;
        }

        try {
            await aplicarCanjeoManual({ puntos: this.puntosCanjeo, motivo: this.motivoCanjeo});

            this.closeModal();
            this.loadData();
            this.showToast('¡Canjeo Exitoso!', `Se han descontado ${this.puntosCanjeo} puntos correctamente.`, 'success');

        } catch (error) {
            this.showToast('Error en el canjeo', error.body ? error.body.message : 'Error desconocido', 'error');
        }
    }

    async cargarCatalogo() {
        try {
            const data = await getRecompensasTienda();
            if (data) {
                this.recompensas = data;
            }
        } catch (error) {
            console.error('Error al cargar recompensas:', error);
            this.showToast('Error', 'No se ha podido cargar los premios disponibles', 'error');
        }
    }

    async handleRedeemReward(event) {
        const rewardTitle = event.detail.title;
        const rewardCost = event.detail.cost;

        if (rewardCost > this.puntosTotales) {
            this.showToast('Saldo Insuficiente', `No hay suficientes puntos para canjear "${rewardTitle}".`, 'error');
            return;
        }

        const result = await LightningConfirm.open({
            message: `¿Estás seguro de que deseas gastar ${rewardCost} puntos en "${rewardTitle}"?`,
            label: 'Confirmar Canjeo',
            theme: 'success'
        });

        if (result) {
            try {
                await aplicarCanjeoManual({
                    puntos: rewardCost,
                    motivo: `Canjeo de premio: ${rewardTitle}`
                });

                await this.cargarSaldo();
                this.showToast('¡Premio Canjeado!', `Has canjeado "${rewardTitle}" correctamente.`, 'success');

            } catch (error) {
                this.showToast('Error en el canjeo', error.body ? error.body.message : 'Error desconocido', 'error');
            }
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }


}