import Lantern from "./zen-garden/lantern";
import Tree from "./zen-garden/tree";

export default function ZenGarden() {
  return (
    <div className="zen-container">
      <svg
        className="zen-base"
        viewBox="0 0 231 231"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="9"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>

        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
      <div className="zen-terrace">
        {/* <div className="zen-terrace-family">
          <div className="zen-terrace-family-thomas" />
        </div> */}
        <div className="zen-terrace-ground">
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className="zen-stones-container">
        <div className="zen-stones-circles">
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="zen-stones">
          <div />
          <div />
          <div />
        </div>
      </div>
      <div className="zen-lantern">
        <Lantern />
      </div>
      <div className="zen-tree">
        <Tree />
      </div>
    </div>
  );
}
