public with sharing class TiendaRecompensasCtrl {

    @AuraEnabled
    public static Paciente__c getPacienteData(){
        try {
            Id contactId = userService.getUserContactId();
            return [SELECT Id, Name, Edad__c, PuntosTotales__c, PermisoCreacionCastigos__c, PermisoCreacionRecompensas__c FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static void aplicarCanjeoManual(Integer puntos, String motivo){
        try {
            Id contactId = userService.getUserContactId();
            
            Paciente__c pac = [SELECT Id, Name, PuntosTotales__c FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId];
            
            Decimal saldoActual = pac.PuntosTotales__c != null ? pac.PuntosTotales__c : 0;
            
            if(saldoActual < puntos) {
                throw new AuraHandledException('No hay suficientes puntos para este canjeo.');
            }
            
            HistorialPuntos__c nuevoCanjeo = new HistorialPuntos__c();
            nuevoCanjeo.Paciente__c = pac.Id;
            nuevoCanjeo.Puntos__c = puntos;
            nuevoCanjeo.Tipo__c = 'Resta';
            nuevoCanjeo.Motivo__c = String.isNotBlank(motivo) ? motivo : 'Canjeo Manual'; 
            
            insert nuevoCanjeo;
            
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<IncentivoPersonalizado__c> getRecompensasTienda() {
        try {
        Id contactId = userService.getUserContactId();
        
        Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId];
        
        return [SELECT Id, CatalogoIncentivos__r.Name, Puntos__c FROM IncentivoPersonalizado__c WHERE Paciente__c = :pac.Id AND CatalogoIncentivos__r.Tipo__c = 'Recompensa' ORDER BY Puntos__c ASC];
                
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener incentivos: ' + e.getMessage());
        }
    }
}