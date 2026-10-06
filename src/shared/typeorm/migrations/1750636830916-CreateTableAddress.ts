import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTableAddress1750636830916 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "tb_address",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "street",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "number",
                        type: "varchar",
                        length: "50",
                        isNullable: true,
                    },
                    {
                        name: "neighbourhood",
                        type: "varchar",
                        length: "100",
                        isNullable: true,
                    },
                    {
                        name: "complement",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "city_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "state_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "zip_code",
                        type: "varchar",
                        length: "10",
                        isNullable: true,
                    },
                    {
                        name: "status",
                        type: "boolean",
                        default: true,
                        isNullable: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp with time zone",
                        default: "CURRENT_TIMESTAMP",
                        isNullable: false,
                    },
                    {
                        name: "updated_at",
                        type: "timestamp with time zone",
                        default: "CURRENT_TIMESTAMP",
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "tb_address",
            new TableForeignKey({
                columnNames: ["city_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_city",
                onDelete: "RESTRICT",
                name: "fk_tb_address_city_id"
            })
        );

        await queryRunner.createForeignKey(
            "tb_address",
            new TableForeignKey({
                columnNames: ["state_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_state",
                onDelete: "RESTRICT",
                name: "fk_tb_address_state_id"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("tb_address", "fk_tb_address_state_id");
        await queryRunner.dropForeignKey("tb_address", "fk_tb_address_city_id");
        await queryRunner.dropTable("tb_address");
    }

}
