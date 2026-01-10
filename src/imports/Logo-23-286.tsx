import svgPaths from "./svg-7knsei4v7m";

function Group() {
  return (
    <div className="relative shrink-0 size-[30px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
        <g id="Group 13">
          <path d={svgPaths.p35253000} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute content-stretch flex gap-[7.143px] inset-[-0.7%_1.88%] items-center" data-name="Logo">
      <Group />
      <div className="h-[30.418px] relative shrink-0 w-[174.741px]" data-name="MEMORI">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 174.741 30.4181">
          <g id="MEMORI">
            <path d={svgPaths.p36e24f00} fill="black" />
            <path d={svgPaths.pdb54080} fill="black" />
            <path d={svgPaths.pad09700} fill="black" />
            <path d={svgPaths.p40e3b00} fill="black" />
            <path d={svgPaths.p8a2970} fill="black" />
            <path d={svgPaths.p32b104c0} fill="black" />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default function Logo1() {
  return (
    <div className="relative size-full" data-name="Logo">
      <Logo />
    </div>
  );
}