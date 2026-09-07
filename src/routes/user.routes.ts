import { Router } from "express";
import { authGuard } from "../middleware/authGuard.js";
import { getAllUsers } from "../controllers/userController.js";
import { rbacGuard } from "../middleware/rbacGuard.js";

const router = Router();
router.use(authGuard);

router.get("/", getAllUsers);

export default router;
