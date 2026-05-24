public with sharing class BlockTaskBatchSchedulable implements Schedulable {
    
    public void execute(SchedulableContext SC) {
        try {
            BlockTaskBatch batch = new BlockTaskBatch();
            Database.executeBatch(batch, 200);
            
        } catch (Exception e) {
            System.debug('Error al ejecutar BlockTaskBatch desde el Schedulable: ' + e.getMessage());
        }
    }

    public static void scheduleEveryFiveMinutes() {
        for (Integer i = 0; i < 60; i += 5) {
            String cronExpr = '0 ' + i + ' * * * ?';
            String jobName = 'Bloqueo Automático Tareas - Min ' + i;
            
            System.schedule(jobName, cronExpr, new BlockTaskBatchSchedulable());
        }
    }
}