import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class CtzHeader extends LightningElement {

    @api title = ''

    @api subtitle = ''

    @api primaryButtonLabel = ''

    @api secondaryButtonLabel = ''

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }
}