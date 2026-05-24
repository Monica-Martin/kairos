import { LightningElement, api} from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class TableSeacher extends LightningElement {

    @api tableData = [];

    @api fieldName = '';

    @api fieldStatus = '';

    @api placeholder = '';

    @api showStatusFilter = false;

    nameFilterValue = '';

    statusFilterValue = '';

    delayTimeout;

    get statusOptions() {

        if (!this.showStatusFilter || !this.fieldStatus) return [];

        const distinctStatuses = [...new Set(this.tableData.map(item => item[this.fieldStatus]))];
        return [
            { label: 'Todos los estados', value: '' },
            ...distinctStatuses.filter(Boolean).map(status => ({ label: status, value: status }))
        ];
    }

    connectedCallback(){
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }

    handleNameChange(evt) {
        window.clearTimeout(this.delayTimeout); 
        
        this.nameFilterValue = evt.target.value.toLowerCase();

        this.delayTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    handleStatusChange(event) {
        this.statusFilterValue = event.target.value;
        this.applyFilters();
    }

    applyFilters() {
    const filteredData = this.tableData.filter(item => {
        const searchName = !this.nameFilterValue ? true : String(item[this.fieldName]).toLowerCase().includes(this.nameFilterValue);

        const searchStatus = !this.statusFilterValue ? true : item[this.fieldStatus] === this.statusFilterValue;

        return searchName && searchStatus;
    });

    this.dispatchEvent(new CustomEvent('filterchange', { detail: filteredData }));
    }

    reset() {
    this.nameFilterValue = '';
    this.statusFilterValue = '';

    const inputField = this.template.querySelector('lightning-input');
    if (inputField) {
        inputField.value = '';
    }

    this.applyFilters();
    }
}