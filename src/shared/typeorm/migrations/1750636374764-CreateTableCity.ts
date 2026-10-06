import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateTableCity1750636374764 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.createTable(
            new Table({
                name: "tb_city",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "state_id",
                        type: "int",
                        isNullable: false, // Uma cidade sempre pertence a um estado
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
            "tb_city",
            new TableForeignKey({
                columnNames: ["state_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_state",
                onDelete: "RESTRICT", 
                name: "fk_tb_city_tb_state"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("tb_city", "fk_tb_city_tb_state"); 
        await queryRunner.dropTable("tb_city");
    }

}
