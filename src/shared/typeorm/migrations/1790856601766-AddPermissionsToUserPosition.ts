import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPermissionsToUserPosition1790856601766 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("tb_user_position");
    if (!hasTable) return;

    const table = await queryRunner.getTable("tb_user_position");
    const hasCol = table?.columns.find((c) => c.name === "permissions");

    if (!hasCol) {
      await queryRunner.addColumn(
        "tb_user_position",
        new TableColumn({
          name: "permissions",
          type: "jsonb",
          isNullable: true,
        })
      );
    }

    // Inserir cargos padrão caso a tabela esteja vazia
    const countRes = await queryRunner.query("SELECT COUNT(*) FROM tb_user_position");
    const count = parseInt(countRes[0]?.count || "0");

    if (count === 0) {
      const allPermissions = JSON.stringify([
        "dashboard:view",
        "customers:view",
        "customers:edit",
        "farms:view",
        "farms:edit",
        "orders:view",
        "orders:edit",
        "schedule:view",
        "schedule:edit",
        "analysis:view",
        "analysis:edit",
        "financial:view",
        "financial:edit",
        "reports:view",
        "reports:edit",
        "settings:view",
        "settings:edit",
      ]);

      const managerPermissions = JSON.stringify([
        "dashboard:view",
        "customers:view",
        "customers:edit",
        "farms:view",
        "farms:edit",
        "orders:view",
        "orders:edit",
        "schedule:view",
        "schedule:edit",
        "analysis:view",
        "analysis:edit",
        "financial:view",
        "financial:edit",
        "reports:view",
        "settings:view",
      ]);

      const agronomistPermissions = JSON.stringify([
        "dashboard:view",
        "customers:view",
        "customers:edit",
        "farms:view",
        "farms:edit",
        "orders:view",
        "orders:edit",
        "schedule:view",
        "schedule:edit",
        "analysis:view",
        "analysis:edit",
        "reports:view",
      ]);

      const operatorPermissions = JSON.stringify([
        "dashboard:view",
        "farms:view",
        "orders:view",
        "schedule:view",
        "schedule:edit",
      ]);

      const financialPermissions = JSON.stringify([
        "dashboard:view",
        "customers:view",
        "orders:view",
        "financial:view",
        "financial:edit",
        "reports:view",
      ]);

      const analystPermissions = JSON.stringify([
        "dashboard:view",
        "farms:view",
        "analysis:view",
        "analysis:edit",
        "reports:view",
      ]);

      await queryRunner.query(`
        INSERT INTO tb_user_position (name, status, permissions) VALUES
        ('Administrador', true, '${allPermissions}'),
        ('Gerente', true, '${managerPermissions}'),
        ('Engenheiro Agrônomo', true, '${agronomistPermissions}'),
        ('Operador de Campo', true, '${operatorPermissions}'),
        ('Financeiro', true, '${financialPermissions}'),
        ('Analista', true, '${analystPermissions}')
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("tb_user_position");
    if (!hasTable) return;
    const table = await queryRunner.getTable("tb_user_position");
    const hasCol = table?.columns.find((c) => c.name === "permissions");
    if (hasCol) {
      await queryRunner.dropColumn("tb_user_position", "permissions");
    }
  }
}
