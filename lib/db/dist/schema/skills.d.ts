import { z } from "zod/v4";
export declare const proficiencyEnum: import("drizzle-orm/pg-core").PgEnum<["beginner", "intermediate", "advanced", "expert"]>;
export declare const skillsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "skills";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "skills";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        name: import("drizzle-orm/pg-core").PgColumn<{
            name: "name";
            tableName: "skills";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        category: import("drizzle-orm/pg-core").PgColumn<{
            name: "category";
            tableName: "skills";
            dataType: "string";
            columnType: "PgText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const freelancerSkillsTable: import("drizzle-orm/pg-core").PgTableWithColumns<{
    name: "freelancer_skills";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/pg-core").PgColumn<{
            name: "id";
            tableName: "freelancer_skills";
            dataType: "number";
            columnType: "PgSerial";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        freelancerProfileId: import("drizzle-orm/pg-core").PgColumn<{
            name: "freelancer_profile_id";
            tableName: "freelancer_skills";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        skillId: import("drizzle-orm/pg-core").PgColumn<{
            name: "skill_id";
            tableName: "freelancer_skills";
            dataType: "number";
            columnType: "PgInteger";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        proficiencyLevel: import("drizzle-orm/pg-core").PgColumn<{
            name: "proficiency_level";
            tableName: "freelancer_skills";
            dataType: "string";
            columnType: "PgEnumColumn";
            data: "beginner" | "intermediate" | "advanced" | "expert";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["beginner", "intermediate", "advanced", "expert"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdAt: import("drizzle-orm/pg-core").PgColumn<{
            name: "created_at";
            tableName: "freelancer_skills";
            dataType: "date";
            columnType: "PgTimestamp";
            data: Date;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "pg";
}>;
export declare const insertSkillSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodString;
}, {
    out: {};
    in: {};
}>;
export declare const insertFreelancerSkillSchema: z.ZodObject<{
    freelancerProfileId: z.ZodInt;
    skillId: z.ZodInt;
    proficiencyLevel: z.ZodOptional<z.ZodEnum<{
        beginner: "beginner";
        intermediate: "intermediate";
        advanced: "advanced";
        expert: "expert";
    }>>;
}, {
    out: {};
    in: {};
}>;
export type Skill = typeof skillsTable.$inferSelect;
export type FreelancerSkill = typeof freelancerSkillsTable.$inferSelect;
export type InsertFreelancerSkill = z.infer<typeof insertFreelancerSkillSchema>;
//# sourceMappingURL=skills.d.ts.map