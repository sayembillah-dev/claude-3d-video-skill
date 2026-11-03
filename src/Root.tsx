import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { AnimalCourtShort, COURT_FRAMES } from "./videos/animal-court";
import { CaptionedVideo } from "../library/captions/CaptionedVideo";
import { Thumbnail } from "../library/thumbnail/Thumbnail";
import COURT_WORDS from "../projects/animal-court/voice/words.json";
import COURT_CAP from "../projects/animal-court/captions.json";

export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="AnimalCourt" component={AnimalCourtShort} durationInFrames={COURT_FRAMES} fps={30} width={1080} height={1920} />
    {/* captions burned onto the finished animal-court render (public/_render/animal-court.mp4, temporary) */}
    <Composition id="AnimalCourtCaptioned" component={CaptionedVideo} durationInFrames={COURT_FRAMES} fps={30} width={1080} height={1920}
      defaultProps={{ src: "_render/animal-court.mp4", words: COURT_WORDS, keywords: COURT_CAP.keywords }} />
    <Composition id="AnimalCourtThumb" component={Thumbnail} durationInFrames={1} fps={30} width={1080} height={1920}
      defaultProps={{ image: "_render/animal-court-thumb.jpg", lines: ["CAN A MONKEY", "SUE YOU?"], accent: ["MONKEY", "SUE"] }} />
    <Composition id="AnimalCourtThumbWide" component={Thumbnail} durationInFrames={1} fps={30} width={1280} height={720}
      defaultProps={{ image: "_render/animal-court-thumb-wide.jpg", lines: ["CAN A MONKEY", "SUE YOU?"], accent: ["MONKEY", "SUE"] }} />
  </>
);
