import { LightningElement, api } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';

export default class CardTienda extends LightningElement {

    @api recompensa;
    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
    }

    handleRedeem() {
        const rewardDetails = {
            id: this.recompensa.Id,
            title: this.recompensa.CatalogoIncentivos__r.Name,
            cost: this.recompensa.Puntos__c
        };

        const redeemEvent = new CustomEvent('redeemreward', {
            detail: rewardDetails,
            bubbles: true,
            composed: true
        });

        this.dispatchEvent(redeemEvent);
    }
}