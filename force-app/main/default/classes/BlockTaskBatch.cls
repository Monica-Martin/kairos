public without sharing class BlockTaskBatch implements Database.Batchable<sObject> {
    
    public Database.QueryLocator start(Database.BatchableContext BC) {
        DateTime ahora = System.now();

        return Database.getQueryLocator([
            SELECT Id, IsBloqueada__c, FechaLimite__c, Estado__c 
            FROM TareaAsignada__c 
            WHERE IsBloqueada__c = false
            AND FechaLimite__c < :ahora
        ]);
    }

    public void execute(Database.BatchableContext BC, List<TareaAsignada__c> scope) {
        List<TareaAsignada__c> tareasAActualizar = new List<TareaAsignada__c>();
        
        for (TareaAsignada__c tarea : scope) {
            tarea.IsBloqueada__c = true;
            tareasAActualizar.add(tarea);
        }
        
        if (!tareasAActualizar.isEmpty()) {
            update tareasAActualizar;
        }
    }

    public void finish(Database.BatchableContext BC) {
    }
}