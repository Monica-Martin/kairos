public without sharing class publicService {
    @AuraEnabled
    public static List<TareaAsignada__c> getTareasSemanaActual(DateTime fechaInicio, DateTime fechaFin, Id pacienteId) {
        try {
            if (String.isBlank(pacienteId)) {
                Id contactId = userService.getUserContactId();
                
                Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId LIMIT 1];
                pacienteId = pac.Id;
            }
            
            return [SELECT Id, FechaPlanificada__c, FechaLimite__c, Estado__c, IsBloqueada__c, Tarea__r.Puntos__c, Tarea__r.CatalogoTareas__r.Descripcion__c, Tarea__r.CatalogoTareas__r.Name, Tarea__r.CatalogoTareas__r.Categoria__c FROM TareaAsignada__c WHERE Paciente__c = :pacienteId AND FechaPlanificada__c >= :fechaInicio AND FechaPlanificada__c <= :fechaFin ORDER BY FechaPlanificada__c ASC];

        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener las tareas: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static List<TareaPersonalizada__c> getCatalogoTareas(Id pacienteId) {
        try {
            Id idFiltro = pacienteId;
            
            if (String.isBlank(idFiltro)) {
                Id contactId = userService.getUserContactId();
                Paciente__c pac = [SELECT Id FROM Paciente__c WHERE FamiliarPrincipal__c = :contactId OR FamiliarSecundario__c = :contactId LIMIT 1];
                idFiltro = pac.Id;
            }
            
            return [SELECT Id, CatalogoTareas__r.Name, CatalogoTareas__r.Categoria__c, CatalogoTareas__r.Descripcion__c, Puntos__c FROM TareaPersonalizada__c WHERE Paciente__c = :idFiltro ORDER BY CatalogoTareas__r.Name ASC];
                    
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener el catálogo: ' + e.getMessage());
        }
    }

    public static Id crearFamiliarYVincular(Id pacienteId, String nombre, String apellidos, String email, String tipoFamiliar, Id accId) {
        Id recordTypeIdFamiliar = Schema.SObjectType.Contact.getRecordTypeInfosByDeveloperName().get('Familiar')?.getRecordTypeId();
        
        if (recordTypeIdFamiliar == null) {
            throw new AuraHandledException('No se ha encontrado el Record Type con DeveloperName \'Familiar\' para el objeto Contacto.');
        }

        Paciente__c datosPac = [SELECT Id, Clinica__c, Clinica__r.OwnerId FROM Paciente__c WHERE Id = :pacienteId LIMIT 1];
        
        Contact nuevoContacto = new Contact(
            FirstName = nombre,
            LastName = apellidos,
            Email = email,
            AccountId = datosPac.Clinica__c,     
            RecordTypeId = recordTypeIdFamiliar,  
            OwnerId = datosPac.Clinica__r.OwnerId
        );
        insert nuevoContacto;

        Paciente__c pac = new Paciente__c(Id = pacienteId);
        if (tipoFamiliar == 'Principal') {
            pac.FamiliarPrincipal__c = nuevoContacto.Id;
        } else {
            pac.FamiliarSecundario__c = nuevoContacto.Id;
        }
        update pac;

        return nuevoContacto.Id;
    }

    public static void insertarUsuarioSistema(User nuevoUsuario) {
        Database.SaveResult sr = Database.insert(nuevoUsuario, false);
        
        if (sr.isSuccess()) {
            Id userId = sr.getId();
            System.debug('Usuario insertado con ID: ' + userId);

            try {
                PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'Familiar' LIMIT 1];
                
                PermissionSetAssignment psa = new PermissionSetAssignment(
                    AssigneeId = userId,
                    PermissionSetId = ps.Id
                );
                insert psa;
                System.debug('Permission Set "Familiar" asignado correctamente.');
            } catch (Exception e) {
                System.debug('Error al asignar el Permission Set: ' + e.getMessage());
            }

            try {
                Network miPortal = [SELECT Id FROM Network WHERE Name = 'Kairos' LIMIT 1];
                System.UserManagement.sendAsyncEmailConfirmation(userId, null, miPortal.Id, null);
                System.debug('Correo de bienvenida y contraseña encolado.');
            } catch (Exception e) {
                System.debug('Error al enviar el correo del portal: ' + e.getMessage());
            }

        } else {
            for(Database.Error err : sr.getErrors()) {
                System.debug('Error DML al insertar Usuario: ' + err.getMessage());
            }
        }
    }

}