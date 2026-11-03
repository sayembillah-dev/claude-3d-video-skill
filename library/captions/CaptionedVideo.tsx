// Burn captions onto an already rendered video without re-rendering its 3D: plays the finished mp4 (copied into
// public/_render/ for the render, removed afterwards by scripts/cleanup.sh) and lays <Captions> on top.
// Register one composition per project in src/Root.tsx with the video's size, length and defaultProps.
import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { Captions, Word, CaptionStyle } from "./Captions";

export type CaptionedProps = { src: string; words: Word[]; keywords?: string[]; style?: CaptionStyle };
export const CaptionedVideo: React.FC<CaptionedProps> = ({ src, words, keywords, style }) => (
  <AbsoluteFill style={{ background: "#000" }}>
    <OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%" }} />
    <Captions words={words} keywords={keywords} style={style} />
  </AbsoluteFill>
);
