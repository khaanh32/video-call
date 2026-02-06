import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();

const app = express();
app.use(cors());

app.get("/getToken", async (req, res) => {
    const room = req.query.room || "demo-room";
    const username = req.query.username || "guest";

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
        return res.status(500).json({
            error: "Missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET",
        });
    }

    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: username,
        }
    );

    at.addGrant({
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();
    res.json({ token });
});

app.listen(5000, () => {
    console.log("Token server running on port 5000");
});
