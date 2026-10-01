type AnimateScreenOptions = {
  direction: "exit";
};

export const animateScreen = (
  ele: HTMLElement,
  animation: string,
  customDelay: number | AnimateScreenOptions = 150,
): (() => void) => {
  if (typeof customDelay !== "number" && customDelay.direction === "exit") {
    const fadeOutClass = animation.endsWith("fadein")
      ? animation.replace(/fadein$/, "fadeout")
      : animation;
    if (!fadeOutClass.endsWith("fadeout")) return () => {};

    ele.classList.remove(fadeOutClass.replace(/fadeout$/, "fadein"));
    ele.classList.add(fadeOutClass);
    return () => {};
  }

  const timer = setTimeout(
    () => {
      ele.classList.remove(animation);
      if (animation.endsWith("fadeout")) {
        ele.classList.add(animation.replace(/fadeout$/, "fadein"));
      }
      if (animation.endsWith("fadein")) {
        ele.classList.add(animation.replace(/fadein$/, "fadeout"));
      }
    },
    typeof customDelay === "number" ? customDelay : 150,
  );

  return () => {
    clearTimeout(timer);
  };
};
