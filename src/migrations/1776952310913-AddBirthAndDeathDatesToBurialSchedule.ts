import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddBirthAndDeathDatesToBurialSchedule1776952310913 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("burial_schedules", [
            new TableColumn({
                name: "birth_date",
                type: "date",
                isNullable: true,
            }),
            new TableColumn({
                name: "death_date",
                type: "date",
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("burial_schedules", "birth_date");
        await queryRunner.dropColumn("burial_schedules", "death_date");
    }
}
