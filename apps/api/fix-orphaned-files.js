const { Pool } = require("pg");
const path = require("path");
const fs = require("fs");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "ht_db",
  user: "postgres",
  password: "123456",
});

async function fixOrphanedFiles() {
  const client = await pool.connect();

  try {
    console.log("🔍 Buscando arquivos com file_path NULL...");

    // Buscar arquivos órfãos
    const orphanedFiles = await client.query(`
      SELECT id, file_name, uploaded_at 
      FROM event_files 
      WHERE file_path IS NULL
    `);

    console.log(`📄 Encontrados ${orphanedFiles.rows.length} arquivos órfãos`);

    for (const file of orphanedFiles.rows) {
      const { id, file_name, uploaded_at } = file;

      // Tentar encontrar o arquivo físico baseado no nome
      const uploadsDir = path.join(__dirname, "uploads");

      // Procurar por arquivos que contenham parte do nome original
      const files = fs.readdirSync(uploadsDir);

      // Buscar por arquivos que podem corresponder
      const possibleMatches = files.filter((f) => {
        const originalName = file_name.replace(/[^a-zA-Z0-9]/g, "");
        const fileName = f.replace(/[^a-zA-Z0-9]/g, "");
        return (
          fileName.includes(originalName) ||
          originalName.includes(fileName.substring(0, 10))
        );
      });

      if (possibleMatches.length > 0) {
        const matchedFile = possibleMatches[0];
        const filePath = path.join(uploadsDir, matchedFile);

        console.log(`✅ Arquivo ${file_name} -> ${matchedFile}`);

        // Atualizar o file_path no banco
        await client.query(
          "UPDATE event_files SET file_path = $1 WHERE id = $2",
          [filePath, id]
        );
      } else {
        console.log(
          `❌ Não foi possível encontrar arquivo físico para: ${file_name}`
        );

        // Remover do banco se não existe arquivo físico
        await client.query("DELETE FROM event_files WHERE id = $1", [id]);
        console.log(`🗑️ Removido arquivo órfão: ${file_name}`);
      }
    }

    console.log("✅ Correção concluída!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixOrphanedFiles();
