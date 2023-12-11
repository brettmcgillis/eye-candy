import { folder } from "leva";

export const Cranium = {
  show_cranium: "Show Cranium",
  show_Left_zygomatic: "Show Left Zygomatic",
  show_Occipital: "Show Occipital",
  show_Right_lacrimal: "Show Right Lacrimal",
  show_Right_max: "Show Right Maxilla",
  show_Right_nasal: "Show Right Nasal",
  show_Right_palatine: "Show Right Palatine",
  show_Right_Parietal: "Show Right Parietal",
  show_Right_temporal: "Show Right Temporal",
  show_Right_zygomatic: "Show Right Zygomatic",
  show_Sphenoid: "Show Sphenoid",
  show_Teeth: "Show Teeth",
  show_Vomer: "Show Vomer",
  show_Ethmoid: "Show Ethmoid",
  show_Frontal: "Show Frontal",
  show_Inferior_conchae: "Show Inferior Conchae",
  show_Left_lacrimal: "Show Left Lacrimal",
  show_Left_maxilla: "Show Left Maxilla",
  show_Left_nasal: "Show Left Nasal",
  show_Left_palatine: "Show Left Palatine",
  show_Left_parietal: "Show Left Parietal",
  show_Left_temporal: "Show Left Temporal",
};
export const Mandible = {
  show_full_mandible: "Show Mandible",
  show_mandible_bone: "Show Mandible Bone",
  show_mandible_teeth: "Show Bottom Teeth",
};

export function folderFromObject(_obj) {
  return folder(
    {
      ...Object.fromEntries(
        Object.entries(_obj).map(([_, value]) => [value, true])
      ),
    },
    { collapsed: true }
  );
}
