import React, { useRef, useEffect, useState } from "react";
import videojs from "video.js";
import { Stage, Layer, Text, Rect } from "react-konva";
import "video.js/dist/video-js.css";

export default function VideoEditor({ videoSrc, initialSubtitles }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 640, height: 360 });
  const [subtitles, setSubtitles] = useState(
    initialSubtitles || [
      {
        id: 1,
        text: "כתובית לדוגמה",
        x: 50,
        y: 50,
        fontSize: 32,
        fill: "#FFFFFF",
        background: "#000000AA",
        startTime: 0,
        endTime: 5
      }
    ]
  );

  // Initialize video.js
  useEffect(() => {
    const playerInstance = videojs(videoRef.current, {
      controls: true,
      preload: "auto",
      responsive: true,
      fluid: true
    });

    setPlayer(playerInstance);

    playerInstance.on("loadedmetadata", () => {
      updateStageSize();
    });

    window.addEventListener("resize", updateStageSize);

    return () => {
      window.removeEventListener("resize", updateStageSize);
      playerInstance.dispose();
    };
  }, []);

  // Update stage size based on video container
  const updateStageSize = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    }
  };

  // Sync subtitles visibility with video time
  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      const currentTime = player.currentTime();
      setSubtitles(prev =>
        prev.map(sub => ({
          ...sub,
          visible: currentTime >= sub.startTime && currentTime <= sub.endTime
        }))
      );
    }, 200);

    return () => clearInterval(interval);
  }, [player]);

  const handleDragMove = (id, e) => {
    setSubtitles(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, x: e.target.x(), y: e.target.y() }
          : sub
      )
    );
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered"
        style={{ width: "100%" }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <Layer>
          {subtitles.map(sub => sub.visible && (
            <React.Fragment key={sub.id}>
              <Rect
                x={sub.x - 5}
                y={sub.y - 5}
                width={sub.text.length * sub.fontSize * 0.6}
                height={sub.fontSize + 10}
                fill={sub.background}
              />
              <Text
                text={sub.text}
                x={sub.x}
                y={sub.y}
                fontSize={sub.fontSize}
                fill={sub.fill}
                draggable
                onDragMove={(e) => handleDragMove(sub.id, e)}
                onDragEnd={() => console.log(`📝 Updated position for subtitle ${sub.id}`)}
                style={{ pointerEvents: "auto" }} // Allow dragging
              />
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
