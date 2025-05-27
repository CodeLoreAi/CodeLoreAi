import { Router } from "express";

const router = Router();

router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Data feeder API is alive",
    timestamp: new Date().toISOString(),
  });
});

export default router;
