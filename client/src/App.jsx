import { useMemo, useState, useEffect } from "react";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles"; // Đảm bảo import style mặc định của LiveKit
import { Track } from "livekit-client";
import "./App.css";

const tokenEndpoint = import.meta.env.VITE_TOKEN_ENDPOINT;


function RoomView() {
  // Xác định xem đang dùng thiết bị di động hay không để chỉnh giao diện
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  return (
    <div className="room-inner">
      {/* Grid video */}
      <GridLayout tracks={tracks} className="video-grid">
        <ParticipantTile />
      </GridLayout>
      
      {/* Xử lý âm thanh phòng */}
      <RoomAudioRenderer />
      
      {/* Thanh điều khiển: minimal cho mobile, verbose cho desktop */}
      <ControlBar 
        variation={isMobile ? "minimal" : "verbose"} 
        controls={{ microphone: true, camera: true, screenShare: !isMobile, chat: false }}
      />
    </div>
  );
}

function App() {
  const [room, setRoom] = useState("demo-room");
  const [username, setUsername] = useState("guest");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const livekitUrl = useMemo(() => {
    return import.meta.env.VITE_LIVEKIT_URL || "";
  }, []);

  const joinRoom = async (e) => {
    e.preventDefault();
    setError("");

    if (!livekitUrl) {
      setError("Thiếu VITE_LIVEKIT_URL trong client/.env");
      return;
    }

    if (!room.trim() || !username.trim()) {
      setError("Vui lòng nhập room và username.");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        room: room.trim(),
        username: username.trim(),
      });
      const res = await fetch(`${tokenEndpoint}/getToken?${params}`);
      if (!res.ok) {
        throw new Error("Không lấy được token từ server.");
      }
      const data = await res.json();
      if (!data.token) {
        throw new Error("Server không trả về token.");
      }
      setToken(data.token);
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = () => {
    setToken("");
  };

  return (
    <div className="page">
      <main className="call-area">
        {!token ? (
          <form className="join-card" onSubmit={joinRoom}>
            <div className="join-title">Tham gia phòng Video Call nhóm one </div>
            <label className="field">
              <span>Tên phòng</span>
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ví dụ: Phong-Hop-1"
              />
            </label>
            <label className="field">
              <span>Tên của bạn</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ví dụ: Nguyen Van A"
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button className="primary" disabled={loading}>
              {loading ? "Đang kết nối..." : "Tham Gia Ngay"}
            </button>
            <div className="join-hint">
              Server: {tokenEndpoint}
            </div>
          </form>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            video={true}
            audio={true}
            className="room"
            onDisconnected={leaveRoom}
          >
            <RoomView />
            <button className="leave-btn" onClick={leaveRoom}>
              Rời phòng
            </button>
          </LiveKitRoom>
        )}
      </main>
    </div>
  );
}

export default App;
