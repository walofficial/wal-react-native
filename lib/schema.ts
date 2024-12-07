import z from "zod";

export const dateOfBirthSchema = z.object({
  date_of_birth: z.string().min(5, "თარიღი სავალდებულოა"),
});

export const userPersonalDetailsSchema = z
  .object({
    interests: z.array(z.string()),
    gender: z.string().min(1, "Gender is required"),
  })
  .and(dateOfBirthSchema);
