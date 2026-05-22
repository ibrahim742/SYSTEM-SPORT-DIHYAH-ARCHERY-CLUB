import { z } from "zod";

export const usernameSchema = z.string().min(3).max(40).regex(/^[a-zA-Z0-9._-]+$/);
export const passwordSchema = z.string().min(8).max(100);
export const coachPasswordSchema = z.string().min(8).max(100);
export const accountRoleSchema = z.enum(["ADMIN", "COACH"]);
export const idSchema = z.string().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/);
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Tanggal tidak valid");
export const timeStringSchema = z.string().regex(/^\d{2}:\d{2}$/);
const noHtmlText = z.string().max(1000).refine((value) => !/[<>]/.test(value), "Tidak boleh berisi tag HTML");
const requiredTextSchema = noHtmlText.min(2);
export const nullableTextSchema = z.preprocess((value) => (value === "" ? null : value), noHtmlText.optional().nullable());
export const optionalEmailSchema = z.preprocess((value) => (value === "" ? null : value), z.string().email().optional().nullable());
export const requiredEmailSchema = z.string().email().max(191);
const phoneSchema = z.string().min(6).max(20).regex(/^[0-9+\-\s()]+$/);
const optionalPhoneSchema = z.preprocess((value) => (value === "" ? undefined : value), phoneSchema.optional());
const nullablePhoneSchema = z.preprocess((value) => (value === "" ? null : value), phoneSchema.optional().nullable());
const uploadedAssetUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().regex(/^\/uploads\/[a-zA-Z0-9._-]+$/).optional().nullable()
);

export const coachProfileSchema = z.object({
  phone: phoneSchema,
  gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  birthDate: dateStringSchema.optional().nullable(),
  address: nullableTextSchema,
  photoUrl: uploadedAssetUrlSchema,
  sportId: idSchema,
  categoryId: idSchema,
  experienceYears: z.coerce.number().int().min(0).max(80),
  certification: nullableTextSchema,
  bio: nullableTextSchema
});

export const userCreateSchema = z.object({
  name: requiredTextSchema.max(80),
  email: optionalEmailSchema,
  image: uploadedAssetUrlSchema,
  username: usernameSchema,
  password: passwordSchema,
  role: accountRoleSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  clubIds: z.array(idSchema).optional(),
  coachProfile: coachProfileSchema.optional()
}).superRefine((payload, context) => {
  if (payload.role !== "COACH") return;
  if (!payload.coachProfile) {
    context.addIssue({ code: "custom", path: ["coachProfile"], message: "Profil coach wajib diisi" });
  }
  if (payload.password.length < 8) {
    context.addIssue({ code: "custom", path: ["password"], message: "Password coach minimal 8 karakter" });
  }
});

export const userUpdateSchema = z.object({
  name: requiredTextSchema.max(80).optional(),
  email: optionalEmailSchema,
  image: uploadedAssetUrlSchema,
  username: usernameSchema.optional(),
  password: passwordSchema.optional(),
  role: accountRoleSchema.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  clubIds: z.array(idSchema).optional(),
  coachProfile: coachProfileSchema.partial().optional()
}).superRefine((payload, context) => {
  if (payload.role === "COACH" && !payload.coachProfile) {
    context.addIssue({ code: "custom", path: ["coachProfile"], message: "Profil coach wajib diisi" });
  }
  if (payload.role === "COACH" && payload.password && payload.password.length < 8) {
    context.addIssue({ code: "custom", path: ["password"], message: "Password coach minimal 8 karakter" });
  }
});

export const clubSchema = z.object({
  name: requiredTextSchema.max(80),
  city: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const sportSchema = z.object({
  name: requiredTextSchema.max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  icon: nullableTextSchema,
  description: nullableTextSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const coachCategorySchema = z.object({
  name: requiredTextSchema.max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  description: nullableTextSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const landingSectionKeySchema = z.enum(["hero", "features", "gallery", "coaches", "sports", "statistics", "cta", "footer"]);
const landingHrefSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .min(1)
    .max(240)
    .refine((value) => value.startsWith("/") || value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("https://"), "Link harus internal, anchor, mailto, atau https")
    .optional()
    .nullable()
);

export const landingSectionSchema = z.object({
  title: requiredTextSchema.max(140),
  subtitle: nullableTextSchema,
  description: nullableTextSchema,
  eyebrow: nullableTextSchema,
  imageUrl: uploadedAssetUrlSchema,
  ctaLabel: nullableTextSchema,
  ctaHref: landingHrefSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional()
});

export const landingItemSchema = z.object({
  sectionKey: landingSectionKeySchema,
  title: requiredTextSchema.max(140),
  subtitle: nullableTextSchema,
  description: nullableTextSchema,
  eyebrow: nullableTextSchema,
  imageUrl: uploadedAssetUrlSchema,
  ctaLabel: nullableTextSchema,
  ctaHref: landingHrefSchema,
  icon: nullableTextSchema,
  value: nullableTextSchema,
  href: landingHrefSchema,
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional()
});

export const selfProfileSchema = z.object({
  name: requiredTextSchema.max(80),
  email: optionalEmailSchema,
  image: uploadedAssetUrlSchema,
  password: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(8).max(100).optional()),
  coachProfile: z
    .object({
      phone: optionalPhoneSchema,
      gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
      birthDate: dateStringSchema.optional().nullable(),
      address: nullableTextSchema,
      photoUrl: uploadedAssetUrlSchema,
      experienceYears: z.coerce.number().int().min(0).max(80).optional(),
      certification: nullableTextSchema,
      bio: nullableTextSchema
    })
    .optional(),
  studentProfile: z
    .object({
      phone: optionalPhoneSchema,
      birthDate: dateStringSchema.optional().nullable(),
      address: nullableTextSchema,
      photoUrl: uploadedAssetUrlSchema
    })
    .optional()
});

export const systemSettingSchema = z.object({
  systemName: requiredTextSchema.max(80),
  systemSubtitle: requiredTextSchema.max(80),
  loginSubtitle: requiredTextSchema.max(160),
  contactWhatsapp: nullablePhoneSchema,
  logoUrl: uploadedAssetUrlSchema,
  faviconUrl: uploadedAssetUrlSchema
});

export const studentCreateSchema = z.object({
  name: requiredTextSchema.max(80),
  username: usernameSchema,
  password: passwordSchema,
  clubId: idSchema,
  sportId: idSchema,
  coachId: idSchema.optional().nullable(),
  birthPlace: nullableTextSchema,
  birthDate: dateStringSchema.optional().nullable(),
  age: z.coerce.number().int().min(5).max(80),
  branch: requiredTextSchema.max(80),
  level: z.enum(["PENGENALAN", "DASAR", "LANJUTAN", "PRESTASI"]),
  phone: phoneSchema,
  address: nullableTextSchema,
  photoUrl: uploadedAssetUrlSchema,
  status: z.enum(["AKTIF", "PEMULIHAN", "NONAKTIF"]).optional()
});

export const studentUpdateSchema = studentCreateSchema
  .extend({
    username: usernameSchema.optional(),
    password: z.preprocess((value) => (value === "" ? undefined : value), passwordSchema.optional())
  })
  .partial()
  .extend({
    progress: z.coerce.number().int().min(0).max(100).optional(),
    attendance: z.coerce.number().int().min(0).max(100).optional()
  });

const optionalSlugSchema = z.preprocess((value) => (value === "" ? undefined : value), z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional());

export const programMaterialSchema = z.object({
  day: noHtmlText.min(1).max(40),
  material: requiredTextSchema.max(120),
  set: noHtmlText.min(1).max(40),
  reps: noHtmlText.min(1).max(40),
  duration: noHtmlText.min(1).max(40),
  note: nullableTextSchema,
  order: z.coerce.number().int().min(1)
});

export const programSchema = z.object({
  slug: optionalSlugSchema,
  sportId: idSchema,
  type: z.enum(["LATIHAN", "PERSIAPAN_TURNAMEN"]).optional(),
  name: requiredTextSchema.max(120),
  level: z.enum(["PENGENALAN", "DASAR", "LANJUTAN", "PRESTASI"]),
  duration: requiredTextSchema.max(40),
  materials: z.coerce.number().int().min(1).optional(),
  intensity: requiredTextSchema.max(40),
  description: nullableTextSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  details: z.array(programMaterialSchema).optional()
});

export const assignmentSchema = z.object({
  studentId: idSchema,
  programId: idSchema,
  status: z.enum(["AKTIF", "SELESAI", "DIBATALKAN"]).optional()
});

export const attendanceSessionSchema = z.object({
  date: dateStringSchema,
  title: requiredTextSchema.max(120),
  note: nullableTextSchema,
  records: z
    .array(
      z.object({
        studentId: idSchema,
        status: z.enum(["HADIR", "TIDAK_MASUK", "IZIN", "SAKIT", "ALPA"]),
        checkIn: timeStringSchema.optional().nullable(),
        checkOut: timeStringSchema.optional().nullable(),
        note: nullableTextSchema
      })
    )
    .optional()
});

export const scoreSchema = z.object({
  studentId: idSchema,
  material: requiredTextSchema.max(120),
  scoredDate: dateStringSchema.optional(),
  technique: z.coerce.number().int().min(0).max(100),
  focus: z.coerce.number().int().min(0).max(100),
  stamina: z.coerce.number().int().min(0).max(100),
  grade: noHtmlText.min(1).max(4),
  note: nullableTextSchema
});

export const trainingLogSchema = z.object({
  studentId: idSchema.optional(),
  date: dateStringSchema.optional(),
  result: noHtmlText.min(1).max(200),
  duration: noHtmlText.min(1).max(40),
  rpe: z.coerce.number().int().min(1).max(1000),
  note: nullableTextSchema,
  status: z.enum(["SELESAI", "PROSES", "BELUM"]).optional()
});

export const notificationReadSchema = z
  .object({
    all: z.boolean().optional(),
    ids: z.array(idSchema).max(100).optional()
  })
  .refine((payload) => payload.all || Boolean(payload.ids?.length), "Pilih notifikasi yang akan ditandai terbaca");

export const forgotPasswordSchema = z.object({
  email: requiredEmailSchema
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(32).max(256),
  password: passwordSchema
});
