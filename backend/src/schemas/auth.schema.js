const { z } = require('zod');

exports.loginSchema = z.object({
  username: z.string({ required_error: 'Username obligatoriu' }).min(1, 'Username obligatoriu').max(50),
  password: z.string({ required_error: 'Parolă obligatorie' }).min(1, 'Parolă obligatorie').max(100),
});

exports.refreshSchema = z.object({
  token: z.string().min(10, 'Token invalid'),
});

exports.logoutSchema = z.object({
  token: z.string().optional(),
});
