import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureDefaultUserPositions1790856601769 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("tb_user_position");
    if (!hasTable) return;

    const defaultPositions = [
      {
        name: "Administrador",
        permissions: [
          "dashboard", "dashboard:view",
          "customers", "customers:view", "customers:edit",
          "farms", "farms:view", "farms:edit",
          "orders", "orders:view", "orders:edit",
          "schedule", "schedule:view", "schedule:edit",
          "analysis", "analysis:view", "analysis:edit",
          "financial", "financial:view", "financial:edit",
          "reports", "reports:view", "reports:edit",
          "settings", "settings:view", "settings:edit",
        ],
      },
      {
        name: "Gerente",
        permissions: [
          "dashboard:view",
          "customers:view", "customers:edit",
          "farms:view", "farms:edit",
          "orders:view", "orders:edit",
          "schedule:view", "schedule:edit",
          "analysis:view", "analysis:edit",
          "financial:view", "financial:edit",
          "reports:view",
          "settings:view",
        ],
      },
      {
        name: "Engenheiro Agrônomo",
        permissions: [
          "dashboard:view",
          "customers:view", "customers:edit",
          "farms:view", "farms:edit",
          "orders:view", "orders:edit",
          "schedule:view", "schedule:edit",
          "analysis:view", "analysis:edit",
          "reports:view",
        ],
      },
      {
        name: "Operador de Campo",
        permissions: [
          "dashboard:view",
          "farms:view",
          "orders:view",
          "schedule:view", "schedule:edit",
        ],
      },
      {
        name: "Financeiro",
        permissions: [
          "dashboard:view",
          "customers:view",
          "orders:view",
          "financial:view", "financial:edit",
          "reports:view",
        ],
      },
      {
        name: "Analista",
        permissions: [
          "dashboard:view",
          "farms:view",
          "analysis:view", "analysis:edit",
          "reports:view",
        ],
      },
    ];

    for (const pos of defaultPositions) {
      const existing = await queryRunner.query(
        `SELECT id, permissions FROM tb_user_position WHERE LOWER(TRIM(name)) = LOWER($1) LIMIT 1`,
        [pos.name]
      );

      const permsJson = JSON.stringify(pos.permissions);

      if (!existing || existing.length === 0) {
        await queryRunner.query(
          `INSERT INTO tb_user_position (name, status, permissions) VALUES ($1, true, $2::jsonb)`,
          [pos.name, permsJson]
        );
      } else {
        const row = existing[0];
        if (!row.permissions || (Array.isArray(row.permissions) && row.permissions.length === 0)) {
          await queryRunner.query(
            `UPDATE tb_user_position SET permissions = $1::jsonb WHERE id = $2`,
            [permsJson, row.id]
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Preserva cargos para não quebrar referências
  }
}
