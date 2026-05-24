import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader'
import myResource from '@salesforce/resourceUrl/toSR'

export default class LandingPage extends LightningElement {

    imgLanding = myResource + '/toSR/img/imgLanding1.webp'

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
    }

}