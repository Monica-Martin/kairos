public with sharing class tareasCtrl {
    
    @AuraEnabled
    public static void checkTarea(Id tareaId, Integer puntos, String titulo) {
        try {
            TareaAsignada__c tareaActualizar = new TareaAsignada__c(
                Id = tareaId,
                Estado__c = 'Completada',
                IsBloqueada__c = true
            );
            update tareaActualizar;

            Id contactId = userService.getUserContactId();
            Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId];

            if (puntos != null && puntos > 0) {
                HistorialPuntos__c nuevoHistorial = new HistorialPuntos__c(
                    Paciente__c = pac.Id,
                    Puntos__c = puntos,
                    Motivo__c = 'Tarea completada: ' + titulo,
                    Tipo__c = 'Suma'
                );
                insert nuevoHistorial;
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Error al completar la tarea: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void asignarNuevaTarea(Id catalogoTareaId, DateTime fechaPlanificada, DateTime fechaLimite, Id pacienteId) {
        try {

            Id idPaciente = pacienteId;

            if (String.isBlank(idPaciente)) {
            Id contactId = userService.getUserContactId();
            Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId];
                idPaciente = pac.Id;
            }

            TareaAsignada__c nuevaTarea = new TareaAsignada__c(
                Paciente__c = idPaciente,
                Tarea__c = catalogoTareaId, 
                FechaPlanificada__c = fechaPlanificada,
                FechaLimite__c = fechaLimite,
                Estado__c = 'Pendiente',
                IsBloqueada__c = false
            );

            insert nuevaTarea;
        } catch (Exception e) {
            throw new AuraHandledException('Error al asignar la tarea: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void registrarMovimientoPuntos(String motivo, Integer puntos, String tipo) {
        try {
            Id contactId = userService.getUserContactId();
            Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId LIMIT 1];

            HistorialPuntos__c nuevoHistorial = new HistorialPuntos__c(
                Paciente__c = pac.Id,
                Puntos__c = puntos,
                Motivo__c = motivo,
                Tipo__c = tipo
            );
            
            insert nuevoHistorial;
        } catch (Exception e) {
            throw new AuraHandledException('Error al registrar los puntos: ' + e.getMessage());
        }
    }
    
}