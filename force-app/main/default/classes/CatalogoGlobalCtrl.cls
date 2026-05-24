public with sharing class CatalogoGlobalCtrl {
    
    @AuraEnabled
    public static List<CatalogoTareas__c> getTareasGlobales(){
        try {
            List<CatalogoTareas__c> tareasList = [SELECT Id, Name, Descripcion__c, Categoria__c, CreatedBy.Name FROM CatalogoTareas__c WHERE CreatedById = :UserInfo.getUserId() ORDER BY CreatedDate DESC];

            return tareasList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<CatalogoIncentivos__c> getIncentivosGlobales(){
        try {
            List<CatalogoIncentivos__c> incentivosList = [SELECT Id, Name, Tipo__c, CreatedBy.Name FROM CatalogoIncentivos__c WHERE CreatedById = :UserInfo.getUserId() ORDER BY CreatedDate DESC];

            return incentivosList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
}