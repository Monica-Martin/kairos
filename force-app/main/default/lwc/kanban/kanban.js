import { LightningElement, api, track } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import myResource from '@salesforce/resourceUrl/toSR';
import checkTarea from '@salesforce/apex/tareasCtrl.checkTarea';
import asignarNuevaTarea from '@salesforce/apex/tareasCtrl.asignarNuevaTarea';
import getTareasSemanaActual from '@salesforce/apex/publicService.getTareasSemanaActual';
import getCatalogoTareas from '@salesforce/apex/publicService.getCatalogoTareas';
import IsTerapeuta from '@salesforce/customPermission/IsTerapeuta';


const arrayTipos = {
    'Higiene': { card: 'task-card--higiene', badge: 'badge--higiene', icono: 'utility:magicwand', claseIcono: 'icon-higiene', modal: 'badge-higiene' },
    'Estudios': { card: 'task-card--estudios', badge: 'badge--estudios', icono: 'utility:knowledge_base', claseIcono: 'icon-estudios', modal: 'badge-estudios' },
    'Comportamiento': { card: 'task-card--comportamiento', badge: 'badge--comportamiento', icono: 'utility:like', claseIcono: 'icon-comportamiento', modal: 'badge-comportamiento' },
    'Autonomía': { card: 'task-card--autonomia', badge: 'badge--autonomia', icono: 'utility:user', claseIcono: 'icon-autonomia', modal: 'badge-autonomia' }
};

const arrayDefault = { card: 'task-card--otros', badge: 'badge--otros', icono: 'utility:tag', claseIcono: 'icon-otros', modal: 'badge-otros' };

export default class Kanban extends LightningElement {

    _paciente;

    textoSemanaActual = 'Semana Actual: 23-29 Oct';
    
    isDetalleModalOpen = false;

    isAsignarModalOpen = false;

    catalogoTareas = [];

    nuevaTareaId = '';

    nuevaFechaPlanificada = '';

    nuevaFechaLimite = '';

    tareaSeleccionada = null;

    textoSemanaActual = ''; 

    fechaReferencia = new Date(); 

    semanaInicioISO = '';

    semanaFinISO = '';
    
    @track diasSemana = [];

    @api
    get paciente() { return this._paciente; }
    set paciente(value) {
        this._paciente = value;
        if (value) {
            if (!this.semanaInicioISO) {
                this.actualizarCabeceraSemana();
            }
            this.cargarTareasDelPaciente();
        }
    }

    get isTerapeuta() {
        return IsTerapeuta;
    }

    get catalogoOptions() {
        return this.catalogoTareas.map(tarea => ({
            label: `${tarea.CatalogoTareas__r?.Name || 'Sin nombre'} (${tarea.CatalogoTareas__r?.Categoria__c || 'Otros'}) - ${tarea.Puntos__c || 0} pts`,
            value: tarea.Id
        }));
    }

    get isGuardarDisabled() {
        return !this.nuevaTareaId || !this.nuevaFechaPlanificada || !this.nuevaFechaLimite;
    }

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
        this.actualizarCabeceraSemana();
    }

    actualizarCabeceraSemana() {
        const refDate = new Date(this.fechaReferencia);
        const day = refDate.getDay();
        
        const diffAlLunes = refDate.getDate() - day + (day === 0 ? -6 : 1); 
        
        const lunes = new Date(refDate.setDate(diffAlLunes));
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);

        const options = { day: 'numeric', month: 'short' };
        const txtLunes = lunes.toLocaleDateString('es-ES', options).replace('.', '');
        const txtDomingo = domingo.toLocaleDateString('es-ES', options).replace('.', '');
        this.textoSemanaActual = `Semana: ${txtLunes} - ${txtDomingo}`;

        lunes.setHours(0, 0, 0, 0);
        domingo.setHours(23, 59, 59, 999);
        
        this.semanaInicioISO = lunes.toISOString();
        this.semanaFinISO = domingo.toISOString();
    }

    async cargarTareasDelPaciente() {
        try {
            const pId = this.paciente ? this.paciente.Id : null;
            const tareasReales = await getTareasSemanaActual({fechaInicio: this.semanaInicioISO, fechaFin: this.semanaFinISO, pacienteId: pId});
            this.organizarTareasPorDia(tareasReales || []);
        } catch (error) {
            this.mostrarToast('Error', 'No se pudieron recuperar las tareas asignadas.', 'error');
        }
    }

    organizarTareasPorDia(tareas) {
    const estructuraDias = [
        { nombre: 'Domingo', tareas: [] },
        { nombre: 'Lunes', tareas: [] },
        { nombre: 'Martes', tareas: [] },
        { nombre: 'Miércoles', tareas: [] },
        { nombre: 'Jueves', tareas: [] },
        { nombre: 'Viernes', tareas: [] },
        { nombre: 'Sábado', tareas: [] }
    ];

    const hoyReal = new Date();

    const nombreDiaHoy = hoyReal.toLocaleDateString('es-ES', { weekday: 'long' });

    const diaHoyFormateado = nombreDiaHoy.charAt(0).toUpperCase() + nombreDiaHoy.slice(1);

    const inicioSemanaActual = new Date(this.semanaInicioISO);

    const finSemanaActual = new Date(this.semanaFinISO);

    const esSemanaActual = (hoyReal >= inicioSemanaActual && hoyReal <= finSemanaActual);

    tareas.forEach(tarea => {
        if (tarea.FechaPlanificada__c) {
            const dateObj = new Date(tarea.FechaPlanificada__c);
            const diaDestino = estructuraDias[dateObj.getDay()];
            if (diaDestino) diaDestino.tareas.push(this.formatearTarea(tarea));
        }
    });

    estructuraDias.forEach(dia => {
        const esDiaActivo = esSemanaActual && (dia.nombre === diaHoyFormateado);
        
        dia.claseTitulo = esDiaActivo ? 'column-title column-title--active' : 'column-title';
    });

    const domingo = estructuraDias.shift();
    estructuraDias.push(domingo);
    this.diasSemana = estructuraDias;
    }

    formatearTarea(tarea) {
        const tipoTarea = tarea.Tarea__r?.CatalogoTareas__r?.Categoria__c || '';
        const tituloTarea = tarea.Tarea__r?.CatalogoTareas__r?.Name || 'Tarea sin título';
        const descripcionTarea = tarea.Tarea__r?.CatalogoTareas__r?.Descripcion__c || 'No hay instrucciones adicionales.';
        const puntosTarea = tarea.Tarea__r?.Puntos__c || 0;
        
        const horaFormateada = tarea.FechaPlanificada__c 
            ? new Date(tarea.FechaPlanificada__c).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
            : '--:--';

        const configVisual = arrayTipos[tipoTarea] || arrayDefault;
        let baseCardClass = configVisual.card;

        if (tarea.IsBloqueada__c === true) {
            baseCardClass += ' task-card--blocked'; 
        }

        return {
            id: tarea.Id,
            titulo: tituloTarea,
            descripcion: descripcionTarea,
            tipo: tipoTarea,
            hora: horaFormateada,
            puntos: puntosTarea,
            puntosFormateados: puntosTarea > 0 ? `+${puntosTarea} pts` : `${puntosTarea} pts`,
            
            claseCard: baseCardClass, 
            
            claseBadge: configVisual.badge,
            claseIcono: configVisual.claseIcono,
            icono: configVisual.icono,
            clasePuntos: puntosTarea > 0 ? 'task-pts points--plus' : 'task-pts points--minus',
            claseBadgeModal: `modal-badge ${configVisual.modal}`,
            estado: tarea.Estado__c,
            bloqueada: tarea.IsBloqueada__c
        };
    }

    async handleCompletarTarea(event) {
        if (this.isTerapeuta) {
            this.mostrarToast('Modo Lectura', 'Solo los tutores pueden completar tareas en el Kanban.', 'info');
            return;
        }

        const { tareaId, puntos, titulo, bloqueada } = event.detail;

        if (bloqueada === true) {
            this.mostrarToast(
                'Tarea Bloqueada', 
                `El tiempo límite para la tarea "${titulo}" ha expirado. Ya no se puede completar.`, 
                'error'
            );
            return;
        }

        try {
            await checkTarea({ tareaId, puntos, titulo });
            this.mostrarToast('¡Buen trabajo!', `Se han sumado ${puntos} puntos por: ${titulo}`, 'success');
            this.dispatchEvent(new CustomEvent('refrescarpanel'));
            this.cargarTareasDelPaciente();
        } catch (error) {
            console.error('Error al completar tarea:', error);
            const msgError = error.body ? error.body.message : 'No se pudo completar la tarea.';
            this.mostrarToast('Error de servidor', msgError, 'error');
        }
    }

    handleAbrirDetalles(event) {
        this.tareaSeleccionada = event.detail;
        this.isDetalleModalOpen = true;
    }

    cerrarDetalleModal() {
        this.isDetalleModalOpen = false;
        this.tareaSeleccionada = null;
    }

    mostrarToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    async handleAssignTask() {
        this.isAsignarModalOpen = true;
        try {
            const pId = (this.paciente && this.paciente.Id) ? this.paciente.Id : null;
            this.catalogoTareas = await getCatalogoTareas({pacienteId: pId});
        } catch (error) {
            this.mostrarToast('Error', 'No se pudo cargar el catálogo de tareas personales.', 'error');
        }
    }

    handleFormChange(event) {
        const field = event.target.name;
        if (field === 'tareaSeleccionada') this.nuevaTareaId = event.target.value;
        if (field === 'fechaPlanificada') this.nuevaFechaPlanificada = event.target.value;
        if (field === 'fechaLimite') this.nuevaFechaLimite = event.target.value;
    }

    async procesarGuardado() {
        const pId = (this.paciente && this.paciente.Id) ? this.paciente.Id : null;
        await asignarNuevaTarea({
            catalogoTareaId: this.nuevaTareaId,
            fechaPlanificada: this.nuevaFechaPlanificada,
            fechaLimite: this.nuevaFechaLimite,
            pacienteId: pId
        });
        
        this.cargarTareasDelPaciente();
    }

    async handlSaveExit() {
        try {
            await this.procesarGuardado();
            this.mostrarToast('¡Éxito!', 'Tarea asignada correctamente.', 'success');
            this.closeAssignModal();
        } catch (error) {
            this.mostrarToast('Error', 'No se pudo guardar la tarea.', 'error');
        }
    }

    async handleSaveNew() {
        try {
            await this.procesarGuardado();
            this.mostrarToast('¡Guardada!', 'Tarea añadida. Puedes configurar la siguiente.', 'success');
            
            this.nuevaTareaId = '';
            this.nuevaFechaPlanificada = '';
            this.nuevaFechaLimite = '';
        } catch (error) {
            this.mostrarToast('Error', 'No se pudo guardar la tarea.', 'error');
        }
    }

    closeAssignModal() {
        this.isAsignarModalOpen = false;
        this.nuevaTareaId = '';
        this.nuevaFechaPlanificada = '';
        this.nuevaFechaLimite = '';
        this.catalogoTareas = [];
    }

    handlePrevWeek() { 
        this.fechaReferencia.setDate(this.fechaReferencia.getDate() - 7);
        this.actualizarCabeceraSemana();
        this.cargarTareasDelPaciente();
    }

    handleNextWeek() { 
        this.fechaReferencia.setDate(this.fechaReferencia.getDate() + 7);
        this.actualizarCabeceraSemana();
        this.cargarTareasDelPaciente();
    }
}