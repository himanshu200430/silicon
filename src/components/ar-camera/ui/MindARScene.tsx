import { createElement, MutableRefObject, useMemo } from "react";

import {
  Character,
  MindARSceneElement,
  Tier,
  TIER_CONFIG,
} from "../types";

interface MindARSceneProps {
  sceneRef: MutableRefObject<MindARSceneElement | null>;
  characters: Character[];
  animationMixerAvailable: boolean;
  registerTargetRef: (
    characterId: string,
    targetIndex: number
  ) => (el: Element | null) => void;
  selectedTier: Tier;
}

export const MindARScene = ({
  sceneRef,
  characters,
  // animationMixerAvailable, // Currently unused but kept for future animation features
  registerTargetRef,
  selectedTier,
}: MindARSceneProps) => {
  // Get the .mind file for the selected tier
  const targetSrc = useMemo(() => {
    return `/ar-targets/${TIER_CONFIG[selectedTier].mindFile}`;
  }, [selectedTier]);

  return createElement(
    "a-scene",
    {
      ref: sceneRef,
      // here - MindAR automatically accesses device camera when mindar-image is initialized
      "mindar-image": `imageTargetSrc: ${targetSrc}; filterMinCF:0.0001; filterBeta: 10`,
      "color-space": "sRGB",
      renderer:
        "colorManagement: true, physicallyCorrectLights: true, legacyLights: false",
      "vr-mode-ui": "enabled: false",
      "device-orientation-permission-ui": "enabled: false",
      embedded: true,
      className: "mindar-scene w-[100vw] h-[100vh]",
    },

    createElement(
      "a-assets",
      null,
      characters
        .filter((character) => !!character.modelUrl)
        .map(
          (character) =>
            character.modelUrl &&
            createElement("a-asset-item", {
              key: `asset-${character.id}`,
              id: `character-model-${character.id}`,
              src: character.modelUrl,
            })
        )
    ),
    // here - a-camera element renders the AR camera view
    createElement("a-camera", {
      position: "0 0 0",
    }),
    createElement("a-entity", {
      light: "type: ambient; intensity: 1",
    }),
    createElement("a-entity", {
      light: "type: directional; intensity: 0.8",
      position: "0 1 0",
    }),
    // Render a target entity for each character in the selected tier.
    // Uses explicit character.targetIndex if configured, otherwise falls back to array index.
    characters.length > 0 &&
      characters.map((character, index) => {
        const targetIndex =
          typeof character.targetIndex === "number"
            ? character.targetIndex
            : index;
        return createElement(
          "a-entity",
          {
            key: character.id,
            ref: registerTargetRef(character.id, targetIndex),
            "mindar-image-target": `targetIndex: ${targetIndex}`,
          },
          character.modelUrl &&
            createElement("a-gltf-model", {
              src: `#character-model-${character.id}`,
              position: "0 0 0",
              rotation: "60 0 0",
              scale: "1 1 1",
              "animation-mixer":
                "clip: pm0149_00_00_20001_battlewait01_loop; loop: repeat",
            })
        );
      })
  );
};

