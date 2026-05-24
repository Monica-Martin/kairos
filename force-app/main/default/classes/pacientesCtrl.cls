public with sharing class pacientesCtrl {
    
    private static Id recordId = userService.getUserContactId();

    @AuraEnabled
    public static List<Paciente__c> getRelatedPacientes(){
        return [SELECT Id, Name, Edad__c, PuntosTotales__c, FamiliarPrincipal__r.Name, (SELECT Id, Estado__c, IsBloqueada__c FROM TareasAsignadas__r WHERE Estado__c = 'Incumplida' AND FechaLimite__c = THIS_WEEK) FROM Paciente__c WHERE Terapeuta__c = :recordId];
    }

    @AuraEnabled
    public static Map<String, Id> getDataTerapeuta() {
        Map<String, Id> resultado = new Map<String, Id>();
        
        resultado.put('clinicaId', userService.getUserAccountId());
        resultado.put('terapeutaId', userService.getUserContactId());
        
        return resultado;
    }

    @AuraEnabled
    public static Paciente__c getPacienteById(Id pacienteId) {
        try {
            return [SELECT Id, Name, Edad__c, FechaNacimiento__c, PuntosTotales__c, NotasClinicas__c, PermisoCreacionTareas__c, PermisoCreacionRecompensas__c, PermisoCreacionCastigos__c, FamiliarPrincipal__r.Name, FamiliarPrincipal__c, FamiliarPrincipal__r.Email, FamiliarSecundario__c, FamiliarSecundario__r.Name, FamiliarSecundario__r.Email, (SELECT Id, CreatedDate, Motivo__c, Puntos__c, Tipo__c, Tarea__r.Tarea__r.CatalogoTareas__r.Name, Tarea__r.Estado__c FROM HistorialesPuntos__r WHERE CreatedDate = THIS_MONTH ORDER BY CreatedDate DESC LIMIT 100) FROM Paciente__c WHERE Id = :pacienteId];
        } catch (Exception e) {
            throw new AuraHandledException('Error al obtener los detalles del paciente: ' + e.getMessage());
        }
    }

    public class TareaMasivaWrapper {
        @AuraEnabled public String globalId;
        @AuraEnabled public String personalId; 
        @AuraEnabled public String nombre;
        @AuraEnabled public String categoria;
        @AuraEnabled public Integer puntos;
        @AuraEnabled public Boolean isActive;
    }

    @AuraEnabled
    public static List<TareaMasivaWrapper> getCatalogoMasivo(Id pacienteId) {
        try {
            List<CatalogoTareas__c> globales = [SELECT Id, Name, Categoria__c FROM CatalogoTareas__c ORDER BY Categoria__c, Name];
            
            List<TareaPersonalizada__c> personalizadas = [SELECT Id, CatalogoTareas__c, Puntos__c FROM TareaPersonalizada__c WHERE Paciente__c = :pacienteId];
            
            Map<Id, TareaPersonalizada__c> mapaPersonales = new Map<Id, TareaPersonalizada__c>();
            for(TareaPersonalizada__c tp : personalizadas) {
                mapaPersonales.put(tp.CatalogoTareas__c, tp);
            }

            List<TareaMasivaWrapper> resultado = new List<TareaMasivaWrapper>();
            for(CatalogoTareas__c cg : globales) {
                TareaMasivaWrapper tw = new TareaMasivaWrapper();
                tw.globalId = cg.Id;
                tw.nombre = cg.Name;
                tw.categoria = cg.Categoria__c;
                
                if(mapaPersonales.containsKey(cg.Id)) {
                    tw.personalId = mapaPersonales.get(cg.Id).Id;
                    tw.puntos = Integer.valueOf(mapaPersonales.get(cg.Id).Puntos__c);
                    tw.isActive = true;
                } else {
                    tw.personalId = null;
                    tw.puntos = 0; 
                    tw.isActive = false;
                }
                resultado.add(tw);
            }
            return resultado;
        } catch (Exception e) {
            throw new AuraHandledException('Error al cargar catálogo masivo: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void guardarCatalogoMasivo(Id pacienteId, String jsonPayload) {
        try {
            List<TareaMasivaWrapper> tareasActualizadas = (List<TareaMasivaWrapper>) JSON.deserialize(jsonPayload, List<TareaMasivaWrapper>.class);
            
            List<TareaPersonalizada__c> paraInsertar = new List<TareaPersonalizada__c>();
            List<TareaPersonalizada__c> paraActualizar = new List<TareaPersonalizada__c>();
            List<TareaPersonalizada__c> paraBorrar = new List<TareaPersonalizada__c>();

            for(TareaMasivaWrapper tw : tareasActualizadas) {
                if(tw.isActive && String.isBlank(tw.personalId)) {
                    paraInsertar.add(new TareaPersonalizada__c(
                        Paciente__c = pacienteId,
                        CatalogoTareas__c = tw.globalId,
                        Puntos__c = tw.puntos
                    ));
                } 
                else if(tw.isActive && String.isNotBlank(tw.personalId)) {
                    paraActualizar.add(new TareaPersonalizada__c(
                        Id = tw.personalId,
                        Puntos__c = tw.puntos
                    ));
                }
                else if(!tw.isActive && String.isNotBlank(tw.personalId)) {
                    paraBorrar.add(new TareaPersonalizada__c(Id = tw.personalId));
                }
            }

            if(!paraInsertar.isEmpty()) insert paraInsertar;
            if(!paraActualizar.isEmpty()) update paraActualizar;
            if(!paraBorrar.isEmpty()) delete paraBorrar;

        } catch (Exception e) {
            throw new AuraHandledException('Error al guardar: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void updatePermisoPaciente(Id pacienteId, String campoPermiso, Boolean valor) {
        try {
            Paciente__c pac = new Paciente__c(Id = pacienteId);
            
            pac.put(campoPermiso, valor);
            
            update pac;
        } catch (Exception e) {
            throw new AuraHandledException('Error al actualizar permiso: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void vincularNuevoFamiliar(Id pacienteId, String nombre, String apellidos, String email, String tipoFamiliar) {
        try {
            if (String.isBlank(email)) throw new AuraHandledException('El email es obligatorio.');

            Id accId = userService.getUserAccountId();
            
            Id nuevoContactoId = publicService.crearFamiliarYVincular(pacienteId, nombre, apellidos, email, tipoFamiliar, accId);

            crearUsuarioComunidadAsync(nuevoContactoId, email, nombre, apellidos);

        } catch (Exception e) {
            throw new AuraHandledException('Error al vincular familiar: ' + e.getMessage());
        }
    }

    @future
    public static void crearUsuarioComunidadAsync(Id contactId, String email, String nombre, String apellidos) {
        try {
            Profile p = [SELECT Id FROM Profile WHERE Name = 'Customer Community User' LIMIT 1];

            String alias = (nombre.substring(0, 1) + apellidos).left(8);
            String nickname = email.substringBefore('@') + String.valueOf(System.now().getTime()).right(4);
            
            String timestamp = String.valueOf(System.now().getTime()).right(5);
            String usernameUnico = email + '.' + timestamp + '.portal';

            User u = new User(
                FirstName = nombre,
                LastName = apellidos,
                Email = email,
                Username = usernameUnico, 
                Alias = alias,
                CommunityNickname = nickname,
                ProfileId = p.Id,
                ContactId = contactId,
                TimeZoneSidKey = 'Europe/Paris',
                LocaleSidKey = 'es_ES',
                EmailEncodingKey = 'ISO-8859-1',
                LanguageLocaleKey = 'es'
            );

            publicService.insertarUsuarioSistema(u);

        } catch (Exception e) {
            System.debug('Error en el futuro: ' + e.getMessage());
        }
    }

    // GENERAR PDFS
    @AuraEnabled
    public static String generarPacientesPDF() {
        List<Paciente__c> listaPacientes = getRelatedPacientes();
        
        String html = '<html><head><style>';
        html += 'body { font-family: sans-serif; font-size: 14px; color: #333; } ';
        html += '.cabecera { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #005fb2; } ';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; } ';
        html += 'th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } ';
        html += 'th { background-color: #f2f2f2; color: #333; font-weight: bold; } ';
        html += '</style></head><body>';
        
        html += '<div class="cabecera">Listado de Pacientes Activos</div>';
        
        html += '<table>';
        html += '<tr><th>Paciente</th><th>Edad</th><th>Puntos Totales</th></tr>';
        
        for (Paciente__c pac : listaPacientes) {
            html += '<tr>';
            html += '<td>' + pac.Name + '</td>';
            html += '<td>' + (pac.Edad__c != null ? String.valueOf(pac.Edad__c) : '-') + '</td>';
            html += '<td>' + (pac.PuntosTotales__c != null ? String.valueOf(pac.PuntosTotales__c) : '0') + ' pts</td>';
            html += '</tr>';
        }
        html += '</table>';
        html += '</body></html>';
        
        Blob pdfBlob;
        if (Test.isRunningTest()) {
            pdfBlob = Blob.valueOf('Test PDF');
        } else {
            pdfBlob = Blob.toPdf(html);
        }
        
        return EncodingUtil.base64Encode(pdfBlob);
    }

    @AuraEnabled
    public static String generarPacienteDetailPDF(Id pacienteId) {
        Paciente__c pac = getPacienteById(pacienteId);
        
        if (pac == null) {
            throw new AuraHandledException('No se han encontrado los datos del paciente.');
        }
        
        String html = '<html><head><style>';
        html += 'body { font-family: sans-serif; font-size: 13px; color: #333; } ';
        html += '.cabecera { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 25px; color: #0176D3; } ';
        html += '.seccion { background-color: #0176D3; color: white; padding: 6px 10px; font-weight: bold; margin-top: 20px; border-radius: 3px; font-size: 14px; } ';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 10px; } ';
        html += 'th, td { border-bottom: 1px solid #dddddd; padding: 8px; text-align: left; } ';
        html += '.tabla-historial th, .tabla-historial td { border: 1px solid #dddddd; padding: 6px; } ';
        html += '.tabla-historial th { background-color: #f2f2f2; color: #333; } ';
        html += 'th { color: #555; width: 35%; } ';
        html += '.pts-suma { color: #2e7d32; font-weight: bold; } ';
        html += '.pts-resta { color: #c62828; font-weight: bold; } ';
        html += '</style></head><body>';
        
        html += '<div class="cabecera">Expediente Clínico: ' + pac.Name + '</div>';
        
        html += '<div class="seccion">Información General</div>';
        html += '<table>';
        html += '<tr><th>Nombre del Paciente:</th><td>' + pac.Name + '</td></tr>';
        
        String fechaNac = pac.FechaNacimiento__c != null ? pac.FechaNacimiento__c.format() : 'No especificada';
        html += '<tr><th>Fecha de Nacimiento:</th><td>' + fechaNac + '</td></tr>';
        html += '<tr><th>Edad:</th><td>' + (pac.Edad__c != null ? String.valueOf(pac.Edad__c) : '-') + ' años</td></tr>';
        html += '<tr><th>Puntos Totales:</th><td><strong>' + (pac.PuntosTotales__c != null ? String.valueOf(pac.PuntosTotales__c) : '0') + ' pts</strong></td></tr>';
        html += '</table>';

        html += '<div class="seccion">Contactos Vinculados</div>';
        html += '<table>';
        
        String famPrincipal = 'No asignado';
        if (pac.FamiliarPrincipal__r != null) {
            famPrincipal = pac.FamiliarPrincipal__r.Name;
            if (String.isNotBlank(pac.FamiliarPrincipal__r.Email)) {
                famPrincipal += ' (' + pac.FamiliarPrincipal__r.Email + ')';
            }
        }
        
        String famSecundario = 'No asignado';
        if (pac.FamiliarSecundario__r != null) {
            famSecundario = pac.FamiliarSecundario__r.Name;
            if (String.isNotBlank(pac.FamiliarSecundario__r.Email)) {
                famSecundario += ' (' + pac.FamiliarSecundario__r.Email + ')';
            }
        }
        
        html += '<tr><th>Familiar Principal:</th><td>' + famPrincipal + '</td></tr>';
        html += '<tr><th>Familiar Secundario:</th><td>' + famSecundario + '</td></tr>';
        html += '</table>';

        html += '<div class="seccion">Permisos del Portal Familiar</div>';
        html += '<table>';
        html += '<tr><th>Creación de Tareas:</th><td>' + (pac.PermisoCreacionTareas__c ? 'Activo' : 'Inactivo') + '</td></tr>';
        html += '<tr><th>Creación de Recompensas:</th><td>' + (pac.PermisoCreacionRecompensas__c ? 'Activo' : 'Inactivo') + '</td></tr>';
        html += '<tr><th>Creación de Castigos:</th><td>' + (pac.PermisoCreacionCastigos__c ? 'Activo' : 'Inactivo') + '</td></tr>';
        html += '</table>';

        html += '<div class="seccion">Historial de Puntos (Mes Actual)</div>';
        
        if (pac.HistorialesPuntos__r != null && !pac.HistorialesPuntos__r.isEmpty()) {
            html += '<table class="tabla-historial">';
            html += '<tr><th>Fecha</th><th>Motivo / Tarea</th><th>Movimiento</th></tr>';
            
            for (HistorialPuntos__c hist : pac.HistorialesPuntos__r) {
                String nombreTarea = hist.Tarea__r?.Tarea__r?.CatalogoTareas__r?.Name;
                String concepto = String.isNotBlank(nombreTarea) ? nombreTarea : (hist.Motivo__c != null ? hist.Motivo__c : 'Ajuste');
                
                String fechaMov = hist.CreatedDate != null ? hist.CreatedDate.format('dd/MM/yyyy HH:mm', 'Europe/Paris') : '-';
                
                Boolean esSuma = hist.Tipo__c == 'Suma';
                String clasePts = esSuma ? 'class="pts-suma"' : 'class="pts-resta"';
                String signo = esSuma ? '+' : '-';
                String puntosTexto = signo + String.valueOf(hist.Puntos__c) + ' pts';
                
                html += '<tr>';
                html += '<td>' + fechaMov + '</td>';
                html += '<td>' + concepto + '</td>';
                html += '<td ' + clasePts + '>' + puntosTexto + '</td>';
                html += '</tr>';
            }
            html += '</table>';
        } else {
            html += '<p style="padding: 10px; font-style: italic; color: #666;">No se registran movimientos de puntos durante este mes.</p>';
        }

        if (String.isNotBlank(pac.NotasClinicas__c)) {
            html += '<div class="seccion">Notas Clínicas (Uso Interno)</div>';
            html += '<p style="line-height: 1.5; padding: 10px; background-color: #fafafa; border: 1px solid #eee; margin-top: 10px;">' + pac.NotasClinicas__c + '</p>';
        }
        
        html += '</body></html>';
        
        Blob pdfBlob;
        if (Test.isRunningTest()) {
            pdfBlob = Blob.valueOf('Test PDF');
        } else {
            pdfBlob = Blob.toPdf(html);
        }
        
        return EncodingUtil.base64Encode(pdfBlob);
    }
}