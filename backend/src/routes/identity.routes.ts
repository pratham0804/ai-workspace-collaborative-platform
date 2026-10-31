import { Router } from "express";

import {
  register,
  login,
  logout,
  loginPage,
} from "../controllers/identity.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { createUserSchema } from "../utils/validation.js";

const router = Router();

router.post(
  "/register",
  validate(createUserSchema),
  register
);

router.get("/login", loginPage);

router.post("/login", login);

router.post("/logout", logout);

export default router;