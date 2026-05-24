public with sharing class Ctz_LoginCtrl {
    
    @AuraEnabled
    public static String login(String username, String password, String startUrl){
        try {
            if(String.isBlank(username) || String.isBlank(password)){
                throw new AuraHandledException('Rellena todos los campos.');
            }
            ApexPages.PageReference infoLogin = Site.login(username, password, startUrl);

            if (infoLogin != null) {
                return infoLogin.getUrl();
            }else{
                throw new AuraHandledException('Email o contraseña incorrectos.');
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
}