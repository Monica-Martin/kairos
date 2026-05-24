import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class Footer extends LightningElement {

    logo = myResource + '/toSR/img/logo.png'

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }
}