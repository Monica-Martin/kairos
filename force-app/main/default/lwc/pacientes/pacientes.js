import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getRelatedPacientes from '@salesforce/apex/pacientesCtrl.getRelatedPacientes';
import generarPacientesPDF from '@salesforce/apex/pacientesCtrl.generarPacientesPDF';
import getDataTerapeuta from '@salesforce/apex/pacientesCtrl.getDataTerapeuta';


export default class Pacientes extends NavigationMixin(LightningElement) {

    allPacientes = [];

    pacientes = [];

    filteredPacientes = [];

    currentPage = 1;

    pageSize = 5;

    totalPages = 0;

    isModalOpen = false;

    idClinica = '';

    idTerapeuta = '';

    columns = [
        { label: 'Paciente', fieldName: 'Name', type: 'text', cellAttributes: {iconName: {fieldName: 'patientIcon'}}},
        { label: 'Edad', fieldName: 'Edad__c', type: 'number'},
        { label: 'Puntos Actuales', fieldName: 'PuntosTotales__c', type: 'number', cellAttributes: { iconName: 'utility:favorite', iconPosition: 'left'}},
        { label: 'Familiar Principal', fieldName: 'FamiliarName', type: 'text'},
        {type: 'button', typeAttributes: { label: 'Ver Paciente', name: 'view_profile', title: 'Ver Paciente', variant: 'border-filled'}}
    ]

    fieldsForm = [
        { apiName: 'Name', required: true },
        { apiName: 'FechaNacimiento__c', required: false },
        { apiName: 'NotasClinicas__c', required: false },
        { apiName: 'PermisoCreacionTareas__c', required: false },
        { apiName: 'PermisoCreacionRecompensas__c', required: false },
        { apiName: 'PermisoCreacionCastigos__c', required: false }
    ];

    get promedioPuntos() {
        if (!this.allPacientes || this.allPacientes.length === 0) return 0;
        let sumaTotal = 0;
        this.allPacientes.forEach(paciente => {
            sumaTotal += paciente.PuntosTotales__c || 0;
        });

        return Math.round(sumaTotal / this.allPacientes.length);
    }

    get alertasCriticas() {
        if (!this.allPacientes || this.allPacientes.length === 0) return 0;
        let totalAlertas = 0;
        this.allPacientes.forEach(paciente => {
            const tareasIncumplidas = paciente.Tareas_Asignadas__r ? paciente.Tareas_Asignadas__r : [];
            if (tareasIncumplidas.length > 3) {
                totalAlertas++;
            }
        });
        return totalAlertas;
    }

    get isFirstPage() { return this.currentPage === 1; }

    get isLastPage() { return this.currentPage >= this.totalPages; }

    get paginationText() {
        if (this.filteredPacientes.length === 0) return '0 pacientes';
        const start = ((this.currentPage - 1) * this.pageSize) + 1;
        let end = this.currentPage * this.pageSize;
        if (end > this.filteredPacientes.length) end = this.filteredPacientes.length;
        return `Mostrando ${start}-${end} de ${this.filteredPacientes.length} pacientes`;
    }

    get pageNumbers() {
        let pages = [];
        for (let i = 1; i <= this.totalPages; i++) {
            pages.push({
                num: i,
                className: i === this.currentPage ? 'page-btn active' : 'page-btn'
            });
        }
        return pages;
    }

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
        this.loadData();
        this.getDataIds();
    }

    loadData(){
        this.getAllPacientes();
    }

    async getAllPacientes(){
        try {
            const data = await getRelatedPacientes();
            
            if (data && data.length > 0) {
                this.allPacientes = data.map(pac => {
                    return {
                        ...pac,
                        FamiliarName: pac.FamiliarPrincipal__r ? pac.FamiliarPrincipal__r.Name : 'Sin familiar asignado',
                        patientIcon: 'standard:client'
                    };
                });

                this.filteredPacientes = [...this.allPacientes];
                this.totalPages = Math.ceil(this.allPacientes.length / this.pageSize);
                this.updatePagination();
            }else{
                this.allPacientes = [];
                this.pacientes = [];
                this.filteredPacientes = [];
                this.totalPages = 0;
            }
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            this.allPacientes = [];
            this.pacientes = [];
        }
    }

    async getDataIds() {
        try {
            const data = await getDataTerapeuta();
            if (data) {
                this.idClinica = data.clinicaId || '';
                this.idTerapeuta = data.terapeutaId || '';
            }
        } catch (error) {
            console.error('Error al obtener el Id del usuario/terapeuta:', error);
        }
    }

    handleSubmit(event) {
        event.preventDefault();       
        const fields = event.detail.fields;
        fields.Clinica__c = this.idClinica;
        fields.Terapeuta__c = this.idTerapeuta;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleOpenModal() {
        this.isModalOpen = true; 
    }

    closeModal() {
        this.isModalOpen = false; 
    }

    handleSuccess(event) {
        this.isModalOpen = false;
        this.loadData();

        const nombrePaciente = event.detail.fields?.Name?.value || 'Paciente';

        this.dispatchEvent(
            new ShowToastEvent({
                title: '¡Paciente Registrado!',
                message: `${nombrePaciente} ha sido creado correctamente en el sistema.`,
                variant: 'success'
            })
        );
    }

    handleGoToPage(event) {
        const pageNumber = parseInt(event.currentTarget.dataset.page, 10);
        if (pageNumber && pageNumber !== this.currentPage) {
            this.currentPage = pageNumber;
            this.updatePagination();
        }
    }

    updatePagination() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = this.currentPage * this.pageSize;
        this.pacientes = this.filteredPacientes.slice(start, end);
    }

    handlePrevious() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updatePagination();
        }
    }

    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.updatePagination();
        }
    }

    handlePageChange(event) {
        event.preventDefault();
    }

    handleFilter(event) {
        this.filteredPacientes = event.detail; 
        this.currentPage = 1; 
        this.totalPages = Math.ceil(this.filteredPacientes.length / this.pageSize); 
        this.updatePagination(); 
    }

    handleViewPatient(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;

        if (actionName === 'view_profile') {
            this[NavigationMixin.Navigate]({
                type: 'comm__namedPage',
                attributes: {
                    name: 'DetallesPaciente__c'
                },
                state: {
                    c__id: row.Id
                }
            });
        }
    }

    async handleCreatePDF() {
        console.log('Iniciando generación de PDF mediante Apex Blob...');
        try {
            const data = await generarPacientesPDF();
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:application/pdf;base64,' + data;
            downloadLink.download = 'ListadoPacientes_Kairos.pdf';
            downloadLink.click();
            console.log('¡PDF descargado con éxito!');
        } catch (error) {
            console.error('Error al generar o descargar el PDF:', error);
        }
    }
}