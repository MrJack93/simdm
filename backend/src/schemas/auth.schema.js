const { z } = require('zod');

exports.loginSchema = z.object({
  username: z.string().min(3, 'Username min 3 caractere').max(50),
  password: z.string().min(6, 'Parolă min 6 caractere').max(100),
});

exports.refreshSchema = z.object({
  token: z.string().min(10, 'Token invalid'),
});

exports.logoutSchema = z.object({
  token: z.string().optional(),
});
