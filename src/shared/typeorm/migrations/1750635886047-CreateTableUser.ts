import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTableUser1750635886047 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "tb_user",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "person_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "user_position_id",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "user",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "password",
                        type: "varchar",
                        length: "255",
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
            "tb_user",
            new TableForeignKey({
                columnNames: ["person_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_person",
                onDelete: "CASCADE",
                name: "fk_user_person_id"
            })
        );

        await queryRunner.createForeignKey(
            "tb_user",
            new TableForeignKey({
                columnNames: ["user_position_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tb_user_position",
                onDelete: "RESTRICT",
                name: "fk_user_user_position_id"
            })
        );


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey('tb_user', 'fk_user_person_id');
        await queryRunner.dropForeignKey('tb_user', 'fk_user_user_position_id');
        await queryRunner.dropTable('tb_user');

    }

}
