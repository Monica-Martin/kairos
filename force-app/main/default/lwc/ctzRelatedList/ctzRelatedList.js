import { LightningElement,api } from 'lwc';

export default class CtzRelatedList extends LightningElement {

    @api recordId

    @api title = ''
    
    @api elements = []

    @api columns = []

    @api hideButton = false

    handleInternalRowAction(event) {
        const customEvent = new CustomEvent('rowaction', {
            detail: event.detail
        });
        this.dispatchEvent(customEvent);
    }

    handleRefresh() {
        this.dispatchEvent(new CustomEvent('refresh'));
    }
}