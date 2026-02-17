import { z } from "zod";

export const raiseQuerySchema = z.object({
   userRole: z.enum(["client"]),   
  userPhone: z.string().min(6),
  query_content: z.string().min(5).max(2000),
  userId: z.string().min(1),
  userName: z.string().min(1),
});


export const resolveQuerySchema = z.object({
  resolverId: z.string().min(1),
  resolverName: z.string().min(1),
  resolverRole: z.string().min(1), // agent / admin / support
  remarks: z.string().nullable().optional(), // can be null or string
  queryId: z.string().min(1),
});
