import svgPaths from "./svg-9komoixg5z";
import imgPen from "figma:asset/8bc18219d6089e7d95a22575b5b89dbd200e0229.png";
import imgFood from "figma:asset/eae1e400af5f7ebfbe86427c0176889032656785.png";

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
    <div className="absolute content-stretch flex gap-[7.143px] inset-0 items-center" data-name="Logo">
      <Group />
      <p className="font-['Alata:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[41.642px] text-black text-nowrap text-white tracking-[4.1642px]">
        <span className="font-['Roboto:Bold',sans-serif] font-bold" style={{ fontVariationSettings: "'wdth' 100" }}>
          ME
        </span>
        <span className="font-['Roboto:Thin',sans-serif] font-thin" style={{ fontVariationSettings: "'wdth' 100" }}>
          MORI
        </span>
      </p>
    </div>
  );
}

function Logo1() {
  return (
    <div className="absolute h-[30px] left-[calc(50%+0.07px)] top-[60px] translate-x-[-50%] w-[220.143px]" data-name="Logo">
      <Logo />
    </div>
  );
}

function Component() {
  return (
    <div className="absolute inset-[0_0_0_83.78%]" data-name="Component 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="Component 1">
          <path d={svgPaths.p43a0580} fill="var(--fill-0, black)" id="Ellipse 1" />
          <path d={svgPaths.p25564710} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Pen() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Pen">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgPen} />
    </div>
  );
}

function Transport() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Transport">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Transport">
          <path d={svgPaths.p22dab600} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Photos() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Photos">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Photos">
          <path d={svgPaths.p37a75900} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Food() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Food">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgFood} />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[30px] inset-[20%_28.38%_20%_8.38%] items-center justify-center">
      <Pen />
      <Transport />
      <Photos />
      <Food />
    </div>
  );
}

function Navbar() {
  return (
    <div className="absolute bottom-[20px] h-[60px] left-1/2 translate-x-[-50%] w-[370px]" data-name="Navbar">
      <Component />
      <div className="absolute bg-[rgba(0,0,0,0.1)] inset-[0_20.27%_0_0] rounded-[50px]" />
      <Frame />
    </div>
  );
}

export default function HomeEmpty() {
  return (
    <div className="bg-white relative size-full" data-name="Home_Empty">
      <Logo1 />
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[normal] left-1/2 text-[41.642px] text-[rgba(0,0,0,0.1)] text-center top-[408px] tracking-[4.1642px] translate-x-[-50%] w-[266px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Add your memories
      </p>
      <Navbar />
    </div>
  );
}