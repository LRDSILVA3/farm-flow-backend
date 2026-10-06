import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateDomainEntities1790856601751 implements MigrationInterface {
    name = 'CreateDomainEntities1790856601751'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "order_id" character varying, "farm_id" character varying, "plot_id" character varying, "type" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Pendente', "results" jsonb, "date" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91421900ca225ed9865d016a940" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "name" character varying NOT NULL, "cpf" character varying NOT NULL, "birth_date" character varying, "email" character varying, "phone" character varying, "zip_code" character varying, "city" character varying, "state" character varying, "cad_pro" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "collaborators" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "name" character varying NOT NULL, "role" character varying, "email" character varying, "phone" character varying, "status" character varying NOT NULL DEFAULT 'Ativo', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f579a5df9d66287f400806ad875" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "name" character varying NOT NULL, "type" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'Ativo', "model" character varying, "plate" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0722e1b9d6eb19f5874c1678740" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "plots" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "farm_id" uuid NOT NULL, "name" character varying NOT NULL, "area" numeric(10,2), "status" character varying NOT NULL DEFAULT 'Ativo', "city" character varying, "state" character varying, "registration" character varying, "lot" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba7eaba496503e69206deae9363" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "farms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "client_id" uuid, "name" character varying NOT NULL, "area" numeric(10,2), "city" character varying, "state" character varying, "contact" character varying, "status" character varying NOT NULL DEFAULT 'Ativo', "registration" character varying, "lot" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_39aff9c35006b14025bba5a43d9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "client_id" uuid, "farm_id" uuid, "type" character varying NOT NULL, "service_name" character varying, "products_data" jsonb, "service_group" character varying, "area" numeric(10,2), "value" numeric(12,2), "status" character varying NOT NULL DEFAULT 'Pendente', "payment" character varying NOT NULL DEFAULT 'Aguardando', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "price" numeric NOT NULL, "quantity" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, "id_client" uuid, "id_sales_products" uuid, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sales_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_sale" character varying NOT NULL, "id_product" character varying NOT NULL, "product_name" character varying NOT NULL, "value" character varying NOT NULL, "quantity" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, "updated_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_923d8bab303d9ca1ac04771c18b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "name" character varying NOT NULL, "value_per_alqueire" character varying, "status" character varying NOT NULL DEFAULT 'Ativo', "products" character varying, "is_fixed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_groups" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "name" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'Ativo', "services" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c541600efebc3f4fefd3d082ef3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying, "role" character varying, "avatar_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "tb_person" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tb_person" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" DROP CONSTRAINT "UQ_924dc706ea4ceb9b4e078c3f258"`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "plots" ADD CONSTRAINT "FK_b1066b61b6c2232303bdfc19e76" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "farms" ADD CONSTRAINT "FK_ebca61a93358603d426db17689b" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_505ba3689ef2763acd6c4fc93a4" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "orders" ADD CONSTRAINT "FK_3181f67751e5bf35b36bfe6287c" FOREIGN KEY ("farm_id") REFERENCES "farms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_c62b2bcdf3a765b920de433e8da" FOREIGN KEY ("id_client") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sales" ADD CONSTRAINT "FK_cb340563b7c4a30e1ec5c51021a" FOREIGN KEY ("id_sales_products") REFERENCES "sales_products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_cb340563b7c4a30e1ec5c51021a"`);
        await queryRunner.query(`ALTER TABLE "sales" DROP CONSTRAINT "FK_c62b2bcdf3a765b920de433e8da"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_3181f67751e5bf35b36bfe6287c"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_505ba3689ef2763acd6c4fc93a4"`);
        await queryRunner.query(`ALTER TABLE "farms" DROP CONSTRAINT "FK_ebca61a93358603d426db17689b"`);
        await queryRunner.query(`ALTER TABLE "plots" DROP CONSTRAINT "FK_b1066b61b6c2232303bdfc19e76"`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tb_user_position" ADD CONSTRAINT "UQ_924dc706ea4ceb9b4e078c3f258" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "tb_person" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tb_person" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "service_groups"`);
        await queryRunner.query(`DROP TABLE "services"`);
        await queryRunner.query(`DROP TABLE "sales_products"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TABLE "orders"`);
        await queryRunner.query(`DROP TABLE "farms"`);
        await queryRunner.query(`DROP TABLE "plots"`);
        await queryRunner.query(`DROP TABLE "equipment"`);
        await queryRunner.query(`DROP TABLE "collaborators"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "analyses"`);
    }

}
