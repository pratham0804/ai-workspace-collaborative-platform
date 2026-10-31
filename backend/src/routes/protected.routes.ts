import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/protected",
  authMiddleware,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "You accessed a protected route!",
      auth: req.auth,
    });
  }
);

export default router;