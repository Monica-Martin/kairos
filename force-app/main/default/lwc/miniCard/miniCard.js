import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';


export default class MiniCard extends LightningElement {

    isCompleted = false;

    isLocked = false;

    _tarea;

    @api isTerapeuta = false

    @api
    get tarea() {
        return this._tarea;
    }
    set tarea(value) {
        this._tarea = value;
        if (value) {
            this.isCompleted = value.estado === 'Completada';
            this.isLocked = value.bloqueada || value.estado === 'Completada';
        }
    }

    get cardClasses() {
        const baseClass = 'mini-card';
        if (this.isCompleted) return `${baseClass} mini-card--completed`;
        return `${baseClass} ${this.tarea?.claseCard || ''}`;
    }

    get badgeClasses() {
        return this.isCompleted ? 'card-badge badge--completed' : `card-badge ${this.tarea?.claseBadge || ''}`;
    }

    get pointsClasses() {
        return this.isCompleted ? 'card-points points--completed' : `card-points ${this.tarea?.clasePuntos || ''}`;
    }

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
    }

    handleCardClick() {
        if (this.isLocked) return;
        this.dispatchEvent(new CustomEvent('abrirdetalles', { detail: this.tarea }));
    }

    handleStopPropagation(event) {
        event.stopPropagation();
    }

    handleCheckChange(event) {
        if (event.target.checked) {
            this.isCompleted = true;
            this.isLocked = true;

            this.dispatchEvent(new CustomEvent('completartarea', {
                detail: {
                    tareaId: this.tarea.id,
                    puntos: this.tarea.puntos,
                    titulo: this.tarea.titulo
                }
            }));
        }
    }
}