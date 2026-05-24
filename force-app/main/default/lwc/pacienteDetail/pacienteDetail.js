import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'
import getPacienteById from '@salesforce/apex/pacientesCtrl.getPacienteById';
import getCatalogoMasivo from '@salesforce/apex/pacientesCtrl.getCatalogoMasivo';
import guardarCatalogoMasivo from '@salesforce/apex/pacientesCtrl.guardarCatalogoMasivo';
import updatePermisoPaciente from '@salesforce/apex/pacientesCtrl.updatePermisoPaciente';
import vincularNuevoFamiliar from '@salesforce/apex/pacientesCtrl.vincularNuevoFamiliar';
import generarPacienteDetailPDF from '@salesforce/apex/pacientesCtrl.generarPacienteDetailPDF';

export default class PacienteDetail extends LightningElement {

    paciente = null;

    isLoading = false;

    activeTab = 'kanban';

    isHistoryModalOpen = false;

    historialData = [];

    catalogoMasivo = [];

    isSavingCatalog = false;

    isVincularModalOpen = false;

    nuevoFamiliar = {
        nombre: '',
        apellidos: '',
        email: '',
        tipo: 'Principal'
    };

    get tipoFamiliarOptions() {
        return [
            { label: 'Familiar Principal', value: 'Principal' },
            { label: 'Familiar Secundario', value: 'Secundario' }
        ];
    }

    historialColumns = [
        { label: 'Fecha', fieldName: 'fechaFormateada', type: 'text', initialWidth: 130 },
        { label: 'Motivo', fieldName: 'conceptoDetalle', type: 'text', wrapText: true },
        { label: 'Origen', fieldName: 'origenTexto', type: 'text', initialWidth: 140 },
        { label: 'Puntos', fieldName: 'puntosTexto', type: 'text', initialWidth: 110, cellAttributes: { class: { fieldName: 'colorPuntos' } } }
    ];

    get isKanbanTab() {return this.activeTab === 'kanban'}

    get isAssignTab() {return this.activeTab === 'assign'}

    get isPermsTab() {return this.activeTab === 'perms'}

    get kanbanTabClass() {return this.activeTab === 'kanban' ? 'tab-btn active' : 'tab-btn'}

    get assignTabClass() {return this.activeTab === 'assign' ? 'tab-btn active' : 'tab-btn'}

    get permsTabClass() {return this.activeTab === 'perms' ? 'tab-btn active' : 'tab-btn'}

    get permisoTareas() { return this.paciente ? this.paciente.PermisoCreacionTareas__c : false}

    get permisoRecompensas() {return this.paciente ? this.paciente.PermisoCreacionRecompensas__c : false}

    get permisoCastigos() {return this.paciente ? this.paciente.PermisoCreacionCastigos__c : false}

    get familiaresVinculados() {
        if (!this.paciente) return [];
console.log('Datos del paciente en LWC:', JSON.stringify(this.paciente));
        let familiares = [];

        if (this.paciente.FamiliarPrincipal__r) {
            familiares.push({
                id: this.paciente.FamiliarPrincipal__c,
                nombre: this.paciente.FamiliarPrincipal__r.Name,
                email: this.paciente.FamiliarPrincipal__r.Email || 'Sin email registrado',
                relacion: 'Familiar Principal',
                hasAccess: true
            });
        }

        if (this.paciente.FamiliarSecundario__r) {
            familiares.push({
                id: this.paciente.FamiliarSecundario__c,
                nombre: this.paciente.FamiliarSecundario__r.Name,
                email: this.paciente.FamiliarSecundario__r.Email || 'Sin email registrado',
                relacion: 'Familiar Secundario',
                hasAccess: true
            });
        }

        return familiares;
    }

    get hayFamiliaresVinculados() {return this.familiaresVinculados && this.familiaresVinculados.length > 0}

    @wire(CurrentPageReference)
    getStateParameters(pageRef) {
        if (pageRef && pageRef.state) {
            this.recordId = pageRef.state.c__id;
            
            if (this.recordId) {
                this.cargarDetallesPaciente();
            }
        }
    }

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }

    handleTabChange(event) {
        const selectedTab = event.currentTarget.dataset.tab;
        this.activeTab = selectedTab;
        
        if (this.activeTab === 'assign' && this.paciente) {
            this.cargarCatalogoMasivo();
        }
    }

    handleSaveCatalog() {
        console.log('Guardando los puntos asignados y tareas activas del catálogo del paciente...');
    }

    handleActionPlaceholder(event) {
        event.preventDefault();
        console.log('Acción decorativa o modal futuro disparado desde el enlace.');
    }

    async cargarDetallesPaciente() {
        this.isLoading = true;
        try {
            const data = await getPacienteById({ pacienteId: this.recordId });
            this.paciente = data;
        } catch (error) {
            console.error('Error al cargar el detalle del paciente:', error);
        } finally {
            this.isLoading = false;
        }
    }

    handleViewHistory() {
        this.isHistoryModalOpen = true;
        
        const registrosRaw = this.paciente && this.paciente.HistorialesPuntos__r ? this.paciente.HistorialesPuntos__r : [];
        
        this.historialData = registrosRaw.map(item => {
            const esSuma = item.Tipo__c === 'Suma';
            
            const nombreTarea = item.Tarea__r?.Tarea__r?.CatalogoTareas__r?.Name;
            const concepto = nombreTarea ? nombreTarea : (item.Motivo__c || 'Sin motivo especificado');
            
            const origen = item.Tarea__c ? `Kanban (${item.Tarea__r?.Estado__c || ''})` : 'Ajuste Manual';

            return {
                ...item,
                fechaFormateada: new Date(item.CreatedDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                conceptoDetalle: concepto,
                origenTexto: origen,
                puntosTexto: esSuma ? `+${item.Puntos__c} pts` : `-${item.Puntos__c} pts`,
                colorPuntos: esSuma ? 'slds-text-color_success slds-text-title_bold' : 'slds-text-color_error slds-text-title_bold'
            };
        });
    }

    closeHistoryModal() {this.isHistoryModalOpen = false;}

    async cargarCatalogoMasivo() {
        this.isLoading = true;
        try {
            const data = await getCatalogoMasivo({ pacienteId: this.paciente.Id });
            
            this.catalogoMasivo = data.map(item => this.formatearFilaCatalogo(item));
        } catch (error) {
            this.mostrarToast('Error', 'No se pudo cargar el catálogo masivo.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    formatearFilaCatalogo(item) {
        // Configuramos iconos según tu lógica de categorías
        let iconName = 'utility:tag';
        let iconClass = 'icon-neutral bg-neutral-light';
        let ptsClass = 'pts-input';

        if (item.isActive) {
            if (item.categoria === 'Higiene') { iconName = 'utility:magicwand'; iconClass = 'icon-higiene bg-higiene-light'; }
            else if (item.categoria === 'Estudios') { iconName = 'utility:knowledge_base'; iconClass = 'icon-estudios bg-estudios-light'; }
            else if (item.categoria === 'Comportamiento') { iconName = 'utility:like'; iconClass = 'icon-comportamiento bg-comportamiento-light'; }
            
            if (item.puntos < 0) ptsClass = 'pts-input pts-input--negative';
        } else {
            // Estilo apagado (gris)
            iconName = 'utility:edit_form';
            iconClass = 'icon-muted bg-neutral-light';
        }

        return {
            ...item,
            iconName,
            iconClass,
            ptsClass,
            rowClass: item.isActive ? 'task-cell' : 'task-cell text-muted',
            isInputDisabled: !item.isActive,
            accionLabel: item.isActive ? 'Desactivar' : 'Activar',
            accionClass: item.isActive ? 'action-link link-danger' : 'action-link'
        };
    }

    handleToggleFila(event) {
        event.preventDefault();
        const globalId = event.currentTarget.dataset.id;
        
        this.catalogoMasivo = this.catalogoMasivo.map(item => {
            if (item.globalId === globalId) {
                const newActiveState = !item.isActive;
                return this.formatearFilaCatalogo({
                    ...item,
                    isActive: newActiveState,
                    puntos: newActiveState && item.puntos === 0 ? 10 : (newActiveState ? item.puntos : 0) 
                });
            }
            return item;
        });
    }

    handlePuntosChange(event) {
        const globalId = event.currentTarget.dataset.id;
        const nuevosPuntos = parseInt(event.target.value, 10) || 0;

        this.catalogoMasivo = this.catalogoMasivo.map(item => {
            if (item.globalId === globalId) {
                return this.formatearFilaCatalogo({ ...item, puntos: nuevosPuntos });
            }
            return item;
        });
    }

    async handleSaveCatalog() {
        this.isSavingCatalog = true;
        try {
            const payload = JSON.stringify(this.catalogoMasivo);
            await guardarCatalogoMasivo({ pacienteId: this.paciente.Id, jsonPayload: payload });
            
            this.mostrarToast('¡Éxito!', 'Catálogo de Mateo actualizado correctamente.', 'success');
            this.cargarCatalogoMasivo(); 
        } catch (error) {
            this.mostrarToast('Error', 'No se guardaron los cambios. Hay tareas ya asignadas', 'error');
        } finally {
            this.isSavingCatalog = false;
        }
    }

    mostrarToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    async handleTogglePermiso(event) {
        const fieldName = event.target.dataset.field;
        const isChecked = event.target.checked;

        try {
            await updatePermisoPaciente({ 
                pacienteId: this.paciente.Id, 
                campoPermiso: fieldName, 
                valor: isChecked 
            });

            this.paciente[fieldName] = isChecked;
            
            this.mostrarToast('Permiso actualizado', 'La configuración de seguridad se ha guardado.', 'success');
        } catch (error) {
            event.target.checked = !isChecked;
            console.error('Error guardando permiso:', error);
            this.mostrarToast('Error', 'No se pudo actualizar el permiso.', 'error');
        }
    }

    handleOpenVincularModal(event) {
        event.preventDefault();
        this.isVincularModalOpen = true;
    }

    closeVincularModal() {
        this.isVincularModalOpen = false;
        this.nuevoFamiliar = { nombre: '', apellidos: '', email: '', tipo: 'Principal' };
    }

    handleFamiliarChange(event) {
        const field = event.target.name;
        this.nuevoFamiliar[field] = event.target.value;
    }

    async handleGuardarFamiliar() {
        if (!this.nuevoFamiliar.nombre || !this.nuevoFamiliar.apellidos || !this.nuevoFamiliar.email) {
            this.mostrarToast('Atención', 'Por favor, rellena todos los campos.', 'warning');
            return;
        }

        this.isLoading = true;
        try {
            await vincularNuevoFamiliar({
                pacienteId: this.paciente.Id,
                nombre: this.nuevoFamiliar.nombre,
                apellidos: this.nuevoFamiliar.apellidos,
                email: this.nuevoFamiliar.email,
                tipoFamiliar: this.nuevoFamiliar.tipo
            });

            this.mostrarToast('¡Éxito!', 'Familiar vinculado. Se ha enviado un email con el acceso.', 'success');
            this.closeVincularModal();
            this.cargarDetallesPaciente();
            
        } catch (error) {
            console.error('Error al vincular familiar:', error);
            this.mostrarToast('Error', 'Hubo un problema al crear el usuario.', 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async handleGeneratePDF(event) {
        if (event) {
            event.preventDefault();
        }

        this.isLoading = true; 
        
        try {
            const base64PDF = await generarPacienteDetailPDF({ pacienteId: this.recordId });
            
            const binaryString = window.atob(base64PDF);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            
            for (let i = 0; i < binaryLen; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const urlBlob = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = urlBlob;
            
            const nombreArchivo = this.paciente && this.paciente.Name ? this.paciente.Name.replace(/\s+/g, '_') : 'Paciente';
            link.download = `Expediente_${nombreArchivo}.pdf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(urlBlob);

            this.mostrarToast('¡Listo!', 'El expediente se ha descargado correctamente.', 'success');

        } catch (error) {
            console.error('Error al descargar el PDF:', error);
            this.mostrarToast('Error', 'Hubo un problema al generar el documento.', 'error');
        } finally {
            this.isLoading = false;
        }
    }
}