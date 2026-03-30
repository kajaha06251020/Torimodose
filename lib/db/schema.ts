import {
  pgTable,
  uuid,
  text,
  timestamp,
  serial,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  type: text("type", { enum: ["quick", "full"] }).notNull(),
  input: text("input").notNull(),
  result: jsonb("result").notNull(),
  totalPotentialSaving: integer("total_potential_saving").default(0),
  answers: jsonb("answers"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const salaryStatistics = pgTable("salary_statistics", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull(),
  occupation: text("occupation").notNull(),
  region: text("region").notNull(),
  ageGroup: text("age_group").notNull(),
  median: integer("median").notNull(),
  p25: integer("p25").notNull(),
  p75: integer("p75").notNull(),
  source: text("source").notNull(),
});

export const diagnosisInputs = pgTable("diagnosis_inputs", {
  id: uuid("id").defaultRandom().primaryKey(),
  diagnosisId: uuid("diagnosis_id")
    .references(() => diagnoses.id)
    .notNull(),
  income: integer("income").notNull(),
  age: integer("age").notNull(),
  occupation: text("occupation").notNull(),
  region: text("region").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deductionRules = pgTable("deduction_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category", { enum: ["income", "credit", "benefit"] }).notNull(),
  questionKey: text("question_key").notNull(),
  condition: text("condition").notNull(),
  formula: jsonb("formula").notNull(),
  legalBasis: text("legal_basis").notNull(),
  maxAmount: integer("max_amount"),
  description: text("description").notNull(),
  howTo: text("how_to").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
