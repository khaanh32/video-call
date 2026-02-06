import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AccessToken } from "livekit-server-sdk";

dotenv.config();

const app = express();

// cho phép mọi domain (demo thì OK)
app.use(cors());

app.get("/getToken", async (req, res) => {
    try {
        const room = req.query.room || "demo-room";
        const username =
            req.query.username || `guest-${Math.floor(Math.random() * 1000)}`;

        if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
            return res.status(500).json({
                error: "Missing LIVEKIT credentials",
            });
        }

        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            {
                identity: username,
                ttl: "10m", // token sống 10 phút (đẹp cho demo)
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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to generate token" });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
