import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  uuid,
  varchar,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  passwordHash: text("password_hash"),
  notify: boolean("notify").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});


export const plan = pgTable("plan", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
});

export const business = pgTable("business", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  tenantSlug: varchar("tenant_slug", { length: 100 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  location: text("location"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscription = pgTable("subscription", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plan.id),
  businessId: uuid("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  renewalType: varchar("renewal_type", { length: 50 }).notNull().default("monthly"),
  startDate: timestamp("s_date").notNull().defaultNow(),
  endDate: timestamp("e_date").notNull(),
});

export const teamMember = pgTable("team_member", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  businessId: uuid("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  permission: jsonb("permission"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const integration = pgTable("integration", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  scopes: text("scopes"),
  externalAccId: text("external_acc_id"),
  provider: varchar("provider", { length: 100 }).notNull(),
  lastSync: timestamp("last_sync"),
});

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  clerkId: text("clerk_id"),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  segment: varchar("segment", { length: 100 }),
});

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id"),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
});

export const product = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => business.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  imagesUrl: jsonb("images_url"),
  externalAccId: text("external_acc_id"),
  stock: integer("stock").default(0),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  lastReprice: timestamp("last_reprice"),
  prediction: jsonb("prediction"),
});

export const productCategory = pgTable("product_category", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => category.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const order = pgTable("order", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  orderVoucher: text("order_voucher"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItem = pgTable("order_item", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => order.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => product.id),
  quantity: integer("quantity").notNull().default(1),
  itemDiscount: decimal("item_discount", { precision: 10, scale: 2 }).default("0"),
});


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  businesses: many(business),
  teamMemberships: many(teamMember),
}));

export const businessRelations = relations(business, ({ one, many }) => ({
  owner: one(user, { fields: [business.userId], references: [user.id] }),
  subscription: one(subscription, { fields: [business.id], references: [subscription.businessId] }),
  teamMembers: many(teamMember),
  integrations: many(integration),
  customers: many(customer),
  products: many(product),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));