import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class Modal extends LightningElement {

    @api isOpen = false;

    @api title = '';

    connectedCallback(){
        loadStyle(this, myResource + '/toSR/commonstyles.css');
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}