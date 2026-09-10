import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phone: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    baseline: v.optional(v.string()),
    createdAt: v.number(),
    lastCheckInAt: v.optional(v.number())
  }).index("by_phone", ["phone"]),

  plans: defineTable({
    userId: v.id("users"),
    targetWindow: v.string(),
    phase: v.string(),
    weeklyTarget: v.string(),
    nextSession: v.string(),
    reason: v.string(),
    version: v.number(),
    createdAt: v.number()
  }).index("by_user", ["userId"]),

  checkIns: defineTable({
    userId: v.id("users"),
    completed: v.boolean(),
    effort: v.union(v.literal("easy"), v.literal("right"), v.literal("hard")),
    soreness: v.union(v.literal("none"), v.literal("some"), v.literal("high")),
    availability: v.optional(v.string()),
    note: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_user", ["userId"])
});
