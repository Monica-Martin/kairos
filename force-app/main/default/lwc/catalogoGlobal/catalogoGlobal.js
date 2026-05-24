import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import LightningConfirm from 'lightning/confirm';
import { deleteRecord } from 'lightning/uiRecordApi';
import getTareasGlobales from '@salesforce/apex/CatalogoGlobalCtrl.getTareasGlobales';
import getIncentivosGlobales from '@salesforce/apex/CatalogoGlobalCtrl.getIncentivosGlobales';


export default class CatalogoGlobal extends LightningElement {

    activeTab = 'tasks';

    modalTitle = '';

    isModalOpen = false;

    selectedRecordId = null;

    tareas = [];

    incentivos = [];

    columnsTareas = [
        {label: 'Tarea', fieldName: 'Name'},
        {label: 'Descripción', fieldName: 'Descripcion__c', wrapText: true},
        {label: 'Categoría', fieldName: 'Categoria__c'},
        {label: 'Creado Por', fieldName: 'CreatedByName'},
        {type: 'button-icon', initialWidth: 50, typeAttributes: { iconName: 'utility:edit', name: 'edit', title: 'Editar', variant: 'bare', alternativeText: 'Editar'}},
        {type: 'button-icon', initialWidth: 50, typeAttributes: { iconName: 'utility:delete', name: 'delete', title: 'Eliminar', variant: 'bare', alternativeText: 'Eliminar'}}
    ];

    columnsIncentivos = [
        {label: 'Incentivo', fieldName: 'Name'},
        {label: 'Tipo', fieldName: 'Tipo__c'},
        {label: 'Creado Por', fieldName: 'CreatedByName'},
        {type: 'button-icon', initialWidth: 50, typeAttributes: { iconName: 'utility:edit', name: 'edit', title: 'Editar', variant: 'bare', alternativeText: 'Editar'}},
        {type: 'button-icon', initialWidth: 50, typeAttributes: { iconName: 'utility:delete', name: 'delete', title: 'Eliminar', variant: 'bare', alternativeText: 'Eliminar'}}
    ];

    formFieldsTareas = [
        {apiName: 'Name', required: true},
        {apiName: 'Descripcion__c', required: true},
        {apiName: 'Categoria__c', required: true}
    ];

    formFieldsIncentivos = [
        {apiName: 'Name', required: true},
        {apiName: 'Tipo__c', required: true},
    ];

    get isTasksTab() {return this.activeTab === 'tasks'};

    get isRewardsTab() {return this.activeTab === 'rewards'};

    get tasksTabClass() {return this.activeTab === 'tasks' ? 'tab-btn active' : 'tab-btn'};

    get rewardsTabClass() { return this.activeTab === 'rewards' ? 'tab-btn active' : 'tab-btn'};

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
        this.loadData();
    }

    loadData(){
        this.getTareas();
        this.getIncentivos();
    }

    async getTareas(){
        try {
            const data = await getTareasGlobales();
            if (data) {
                this.tareas = data.map(record => {
                    return {
                        ...record,
                        CreatedByName: record.CreatedBy ? record.CreatedBy.Name : 'Desconocido'
                    };
                });
            }
        } catch (error) {
            console.error('Error al obtener tareas:', error);            
        }
    }

    async getIncentivos(){
        try {
            const data = await getIncentivosGlobales();
            if (data) {
                this.incentivos = data.map(record => {
                    return {
                        ...record,
                        CreatedByName: record.CreatedBy ? record.CreatedBy.Name : 'Desconocido'
                    };
                });
            }
        } catch (error) {
            console.error('Error al obtener incentivos:', error);
        }
    }

    handleTabChange(event) {
        this.activeTab = event.currentTarget.dataset.tab;
    }

    handleNewTarea() {
        this.selectedRecordId = null;
        this.modalTitle = 'Nueva Tarea Global';
        this.isModalOpen = true;
    }

    handleNewIncentivo() {
        this.selectedRecordId = null;
        this.modalTitle = 'Nuevo Incentivo Global';
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
        this.selectedRecordId = null;
    }

    handleSuccess(event) {
        this.isModalOpen = false;
        this.loadData();
    }

   async handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        const isTasks = this.activeTab === 'tasks';

        if (actionName === 'edit') {
            this.selectedRecordId = row.Id;
            this.modalTitle = isTasks ? 'Editar Tarea Global' : 'Editar Incentivo Global';
            this.isModalOpen = true;
            
        } else if (actionName === 'delete') {
            const result = await LightningConfirm.open({
                message: isTasks 
                    ? '¿Estás seguro de que deseas eliminar esta tarea?' 
                    : '¿Estás seguro de que deseas eliminar este incentivo?',
                label: 'Confirmar eliminación',
                theme: 'warning'
            });

            if (result) {
                try {
                    await deleteRecord(row.Id);
                    this.loadData();
                    
                    this.dispatchEvent(new ShowToastEvent({
                        title: 'Eliminado',
                        message: 'Registro eliminado correctamente',
                        variant: 'success'
                    }));
                } catch (error) {
                    console.error('Error eliminando registro:', error);
                }
            }
        }
    }
}