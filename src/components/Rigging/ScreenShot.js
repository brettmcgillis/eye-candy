import { button, useControls } from "leva";

function ScreenShotControls() {
  useControls(
    "ScreenShot",
    {
      name: "canvas",
      png: button((get) => {
        let name = get("ScreenShot.name");
        if (!name.length) {
          name = "Canvas";
        }
        const link = document.createElement("a");
        link.setAttribute("download", `${name}.png`);
        link.setAttribute(
          "href",
          document
            .querySelector("canvas")
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream")
        );
        link.click();
      }),
    },
    { collapsed: true }
  );
  return <></>;
}

export default ScreenShotControls;
