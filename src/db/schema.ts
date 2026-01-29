import { pgTable, pgEnum, serial, varchar, text, date, timestamp, integer } from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "interviewing",
  "rejected",
  "offer",
  "accepted",
]);

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  company: varchar("company", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  url: text("url"),
  status: applicationStatusEnum("status").default("applied"),
  appliedDate: date("applied_date").defaultNow(),
  lastContact: date("last_contact"),
  notes: text("notes"),
  salaryRange: varchar("salary_range", { length: 100 }),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leetcodeDifficultyEnum = pgEnum("leetcode_difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const leetcode = pgTable("leetcode", {
  id: serial("id").primaryKey(),
  problemName: varchar("problem_name", { length: 255 }).notNull(),
  problemNumber: integer("problem_number"),
  difficulty: leetcodeDifficultyEnum("difficulty"),
  topics: text("topics"), // Store as JSON string for simplicity
  solvedDate: date("solved_date").defaultNow(),
  timeMinutes: integer("time_minutes"),
  notes: text("notes"),
  solutionApproach: text("solution_approach"),
});
