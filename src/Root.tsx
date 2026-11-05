import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AnimalCourtShort, COURT_FRAMES } from "./videos/animal-court";
import { DnaDriveShort, DNA_FRAMES } from "./videos/dna-drive";
import { DnaDrive2Short, DNA2_FRAMES } from "./videos/dna-drive-v2";
import { TeleportShort, TELEPORT_FRAMES } from "./videos/teleport";
import { SleepShort, SLEEP_FRAMES } from "./videos/sleep-experiment";
import { CaptionedVideo } from "../library/captions/CaptionedVideo";
import { Thumbnail } from "../library/thumbnail/Thumbnail";
import COURT_WORDS from "../projects/animal-court/voice/words.json";
import COURT_CAP from "../projects/animal-court/captions.json";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AnimalCourt" component={AnimalCourtShort} durationInFrames={COURT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DnaDrive" component={DnaDriveShort} durationInFrames={DNA_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DnaDrive2" component={DnaDrive2Short} durationInFrames={DNA2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SleepExperiment" component={SleepShort} durationInFrames={SLEEP_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SleepThumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/sleep-thumb.jpg", lines: ["THE RUSSIAN", "SLEEP", "EXPERIMENT"], accent: ["SLEEP"] }} />
    <Composition id="SleepThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/sleep-thumb-wide.jpg", lines: ["THE RUSSIAN", "SLEEP EXPERIMENT"], accent: ["SLEEP"] }} />
    <Composition id="Teleport" component={TeleportShort} durationInFrames={TELEPORT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="TeleportThumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/teleport-thumb.jpg", lines: ["TELEPORT", "= DEATH?"], accent: ["DEATH"] }} />
    <Composition id="TeleportThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/teleport-thumb.jpg", lines: ["IT DOESN'T MOVE YOU.", "IT COPIES YOU."], accent: ["COPIES"] }} />
    <Composition id="DnaDrive2Thumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/dna-drive-v2-thumb.jpg", lines: ["YOU ARE A", "28 ZETTABYTE", "HARD DRIVE"], accent: ["28", "ZETTABYTE"] }} />
    <Composition id="DnaDrive2ThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/dna-drive-v2-thumb.jpg", lines: ["YOU ARE A", "HARD DRIVE"], accent: ["HARD", "DRIVE"] }} />
    <Composition id="DnaDriveThumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/dna-drive-thumb.jpg", lines: ["YOUR BODY IS A", "HARD DRIVE"], accent: ["HARD", "DRIVE"] }} />
    <Composition id="DnaDriveThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/dna-drive-thumb-wide.jpg", lines: ["YOUR BODY", "IS A", "HARD DRIVE"], accent: ["HARD", "DRIVE"] }} />
    {/* captions burned onto the finished animal-court render (public/_render/animal-court.mp4, temporary) */}
    <Composition id="AnimalCourtCaptioned" component={CaptionedVideo} durationInFrames={COURT_FRAMES} fps={30} width={1080} height={1920}
      defaultProps={{ src: "_render/animal-court.mp4", words: COURT_WORDS, keywords: COURT_CAP.keywords }} />
    <Composition id="AnimalCourtThumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/animal-court-thumb.jpg", lines: ["CAN A MONKEY", "SUE YOU?"], accent: ["MONKEY", "SUE"] }} />
    <Composition id="AnimalCourtThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/animal-court-thumb-wide.jpg", lines: ["CAN A MONKEY", "SUE YOU?"], accent: ["MONKEY", "SUE"] }} />
  </>
);
