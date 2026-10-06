import {MigrationInterface, QueryRunner, Table} from "typeorm";

export class CreateTableState1750636307223 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.createTable(
            new Table({
                name: "tb_state",
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
                        length: "100",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "uf", // Sigla do estado, ex: "SP", "MG"
                        type: "varchar",
                        length: "2",
                        isUnique: true,
                        isNullable: false,
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
         await queryRunner.dropTable('tb_state');
    }

}
