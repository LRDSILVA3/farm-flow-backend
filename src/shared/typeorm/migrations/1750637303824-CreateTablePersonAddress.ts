import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTablePersonAddress1750637303824 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "tb_person_address",
                columns: [
                    {
                        name: "person_id",
                        type: "int",
                        isPrimary: true, // Parte da chave primária composta
                        isNullable: false,
                    },
                    {
                        name: "address_id",
                        type: "int",
                        isPrimary: true, // Parte da chave primária composta
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

        await queryRunner.createForeignKey(
            "tb_person_address",
            new TableForeignKey({
                columnNames: ["person_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_person",
                onDelete: "CASCADE",
                name: "fk_tb_person_address_person_id"
            })
        );


        await queryRunner.createForeignKey(
            "tb_person_address",
            new TableForeignKey({
                columnNames: ["address_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_address",
                onDelete: "CASCADE",
                name: "fk_tb_person_address_address_id"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tb_person_address", true,true);
    }

}
