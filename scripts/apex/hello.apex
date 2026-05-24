// 1. Instanciamos tu clase Batch
BlockTaskBatch miBatch = new BlockTaskBatch();

// 2. Le ordenamos a Salesforce que lo ejecute inmediatamente
Database.executeBatch(miBatch);