import { LightningElement } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import myResource from '@salesforce/resourceUrl/toSR';
import login from '@salesforce/apex/Ctz_LoginCtrl.login';


export default class CtzLogin extends LightningElement {

    logo = myResource + '/toSR/img/logo.png'

    username = '';

    password = '';

    errorMessage = '';

    isLoading = false;

    connectedCallback() {
        loadStyle(this, myResource + '/toSR/commonstyles.css')
        loadStyle(this, myResource + '/toSR/pages/login.css')
    }

    disconnectedCallback(){
        const linkTags = document.querySelectorAll('link[href*="myResource"]');
        linkTags.forEach(link => link.remove());
    }                                                                                                                                                           

    handleKeyUp(event) {
        if (event.key === 'Enter') {
            this.handleLogin();
        }
    }

    async handleLogin(){

        this.errorMessage = '';
        const usernameInput = this.template.querySelector('input[data-id="username"]');
        this.username = usernameInput ? usernameInput.value : '';

        const passwordInput = this.template.querySelector('input[data-id="password"]');
        this.password = passwordInput ? passwordInput.value : '';

        this.errorMessage = '';

        if(!this.username || !this.password){
            this.errorMessage = 'Por favor, completa todos los campos';
            return;
        }

        this.isLoading = true;
        const startUrl = '/s/dashboard';

        try {
            const resultUrl = await login({username: this.username, password: this.password, startUrl: startUrl})
            if (resultUrl) {
                window.location.href = resultUrl;
            }    
        } catch (error) {
            this.isLoading = false;
            this.errorMessage = 'Credenciales inválidas. Si el error persiste, contacte con el administrador.';
            console.error('Login Error:', error);
        }
    }
}