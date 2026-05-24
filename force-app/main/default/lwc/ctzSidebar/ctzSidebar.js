import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';
import IsTerapeuta from '@salesforce/customPermission/IsTerapeuta';
import IsFamiliar from '@salesforce/customPermission/IsFamiliar';

export default class CtzSidebar extends LightningElement {

    activeTab = '';

    logo = myResource + '/toSR/img/logo.png'

    terapeutaTabs = [
        {icon: 'utility:ad_set', title: 'Dashboard', url: '/s/dashboard'},
        {icon: 'utility:company', title: 'Pacientes', url: '/s/pacientes'},
        {icon: 'utility:file', title: 'Catálogos', url: '/s/catalogos-globales'},
    ];

    famTabs = [
        {icon: 'utility:ad_set', title: 'Dashboard', url: '/s/dashboard'},
        {icon: 'utility:file', title: 'Tienda', url: '/s/tienda-recompensas'},
        {icon: 'utility:custom_apps', title: 'Kanban', url: '/s/kanban'},
    ];

    terapeutaSubtitle = 'Portal del terapeuta';

    famSubtitle = 'Portal familiar';

    get subtitle() {
        if (IsTerapeuta) {
            return this.terapeutaSubtitle;
        } else if (IsFamiliar) {
            return this.famSubtitle;
        }
        return [];
    }
    
    get logoutLink() {
        return `/secur/logout.jsp`;
    }

    get tabs() {
        let currentTabs = [];
        if (IsTerapeuta) {
            currentTabs = this.terapeutaTabs;
        } else if (IsFamiliar) {
            currentTabs = this.famTabs;
        }
        
        return currentTabs.map(tab => {
            return {
                ...tab,
                className: tab.title === this.activeTab ? 'nav-item active' : 'nav-item'
            };
        });
    }


    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css');
        this.getActiveTab();
    }

    getActiveTab(){
        const path = window.location.pathname.toLowerCase();
        
        let currentTab = this.tabs.find(tab => path.includes(tab.url.toLowerCase()));
        
        if (currentTab) {
            this.activeTab = currentTab.title;
        } 
        else if (path.includes('detalles-paciente')) {
            this.activeTab = 'Pacientes';
        } 
        else {
            this.activeTab = 'Dashboard';
        }
    }

    handleTabClick(evt){
        this.activeTab = evt.currentTarget.dataset.id;
    }
}